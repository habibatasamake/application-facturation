const prisma = require("../config/prisma");
const aiInvoiceService = require("../services/aiInvoice.service");

/**
 * Rapproche les articles détectés par l'IA avec le catalogue du commerçant
 */
const matchItemsWithCatalog = (extractedItems = [], catalogProducts = []) => {
  return extractedItems.map((item) => {
    const cleanItemName = (item.productName || "").trim().toLowerCase();

    // Recherche d'une correspondance dans le catalogue (insensible à la casse)
    const matchedProduct = catalogProducts.find((p) => {
      const pName = p.name.trim().toLowerCase();
      return (
        pName === cleanItemName ||
        pName.includes(cleanItemName) ||
        cleanItemName.includes(pName)
      );
    });

    const quantity = Math.max(1, Number(item.quantity) || 1);

    if (matchedProduct) {
      const unitPrice =
        item.unitPrice && Number(item.unitPrice) > 0
          ? Number(item.unitPrice)
          : Number(matchedProduct.unitPrice);
      const taxRate = Number(matchedProduct.taxRate || 0);
      const lineSubTotal = unitPrice * quantity;
      const lineTaxTotal = lineSubTotal * (taxRate / 100);
      const lineTotal = lineSubTotal + lineTaxTotal;

      return {
        productId: matchedProduct.id,
        productName: matchedProduct.name,
        description: matchedProduct.description || "",
        unitPrice,
        unit: matchedProduct.unit || "unité",
        taxRate,
        quantity,
        lineSubTotal,
        lineTaxTotal,
        lineTotal,
        inCatalog: true,
      };
    }

    // Article hors catalogue (saisie manuelle ou nouveau produit à référencer)
    const unitPrice = Number(item.unitPrice) || 0;
    const lineSubTotal = unitPrice * quantity;

    return {
      productId: null,
      productName: item.productName || "Article divers",
      description: "",
      unitPrice,
      unit: item.unit || "unité",
      taxRate: 0,
      quantity,
      lineSubTotal,
      lineTaxTotal: 0,
      lineTotal: lineSubTotal,
      inCatalog: false,
    };
  });
};

/**
 * Endpoint POST /api/ai/parse-invoice
 * Analyse une phrase ou une note vocale et renvoie les données structurées de facture
 */
const parseInvoicePrompt = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { prompt } = req.body;
    let audioBuffer = null;

    if (req.file) {
      audioBuffer = req.file.buffer;
    }

    if (!prompt && !audioBuffer) {
      return res.status(400).json({
        message: "Veuillez fournir une instruction texte ou un enregistrement audio.",
      });
    }

    // 1. Récupération des données du commerçant
    const [businessProfile, products, customers] = await Promise.all([
      prisma.businessProfile.findUnique({
        where: { userId },
      }),
      prisma.product.findMany({
        where: { userId, isActive: true },
      }),
      prisma.customer.findMany({
        where: { userId },
      }),
    ]);

    // 2. Appel du service IA (Gemini ou OpenAI)
    const aiResult = await aiInvoiceService.analyzeMerchantMessage({
      text: prompt,
      audioBuffer,
      businessName: businessProfile?.businessName || "Commerce",
      currency: businessProfile?.currency || "FCFA",
      products,
      customers,
      currentDraft: null,
    });

    // 3. Rapprochement des articles avec le catalogue
    const items = matchItemsWithCatalog(aiResult.items || [], products);

    // 4. Rapprochement du client
    let matchedCustomer = null;
    let isExisting = false;

    if (aiResult.customer?.name) {
      const q = aiResult.customer.name.trim().toLowerCase();
      matchedCustomer = customers.find(
        (c) =>
          c.name.toLowerCase() === q ||
          c.name.toLowerCase().includes(q) ||
          q.includes(c.name.toLowerCase())
      );
    }

    let customerData = null;
    if (matchedCustomer) {
      customerData = {
        id: matchedCustomer.id,
        name: matchedCustomer.name,
        phone: matchedCustomer.phone || "",
        email: matchedCustomer.email || "",
        address: matchedCustomer.address || "",
        city: matchedCustomer.city || "",
        country: matchedCustomer.country || "",
        isExisting: true,
      };
      isExisting = true;
    } else if (aiResult.customer?.name) {
      customerData = {
        id: null,
        name: aiResult.customer.name,
        phone: aiResult.customer.phone || "",
        email: "",
        address: "",
        city: "",
        country: "",
        isExisting: false,
      };
    }

    // Identifier les articles qui ne sont pas dans le catalogue
    const missingCatalogItems = items
      .filter((it) => !it.inCatalog)
      .map((it) => ({
        productName: it.productName,
        quantity: it.quantity,
        unit: it.unit || "unité",
        unitPrice: it.unitPrice || 0,
      }));

    return res.status(200).json({
      success: true,
      message: aiResult.friendlyMessage || "Facture analysée avec succès.",
      data: {
        customer: customerData,
        isExistingCustomer: isExisting,
        items,
        missingCatalogItems,
        notes: aiResult.notes || null,
        discount: aiResult.discount || 0,
      },
    });
  } catch (error) {
    console.error("Erreur parseInvoicePrompt :", error);
    next(error);
  }
};

module.exports = {
  parseInvoicePrompt,
};
