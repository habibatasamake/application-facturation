const prisma = require("../config/prisma");
const whatsappService = require("../services/whatsapp.service");
const aiInvoiceService = require("../services/aiInvoice.service");
const { buildInvoiceData, generateInvoiceNumber } = require("./invoice.controller");
const { generateInvoicePdf } = require("../services/invoicePdf.service");

/**
 * Handshake de vérification GET de Meta WhatsApp
 */
const handleWebhookVerification = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log(" Webhook WhatsApp validé par Meta");
    return res.status(200).send(challenge);
  }

  console.warn(" Échec de vérification du Webhook WhatsApp");
  return res.sendStatus(403);
};

/**
 * Formate un montant en FCFA avec séparateur de milliers
 */
const formatCurrency = (amount, currency = "FCFA") => {
  return `${Math.round(amount).toLocaleString("fr-FR")} ${currency}`;
};

/**
 * Associe les articles détectés par l'IA aux produits existants dans le catalogue
 */
const resolveItemsWithCatalog = (extractedItems = [], catalogProducts = []) => {
  return extractedItems.map((item) => {
    const cleanItemName = (item.productName || "").trim().toLowerCase();

    // Recherche d'une correspondance dans le catalogue (insensible à la casse)
    const matchedProduct = catalogProducts.find((p) => {
      const pName = p.name.trim().toLowerCase();
      return pName === cleanItemName || pName.includes(cleanItemName) || cleanItemName.includes(pName);
    });

    if (matchedProduct) {
      return {
        productId: matchedProduct.id,
        productName: matchedProduct.name,
        description: matchedProduct.description,
        unitPrice: item.unitPrice && Number(item.unitPrice) > 0 ? Number(item.unitPrice) : matchedProduct.unitPrice,
        quantity: Number(item.quantity) || 1,
        unit: matchedProduct.unit,
        taxRate: matchedProduct.taxRate || 0,
      };
    }

    // Article hors catalogue (saisie libre)
    return {
      productId: null,
      productName: item.productName || "Article divers",
      description: null,
      unitPrice: Number(item.unitPrice) || 0,
      quantity: Number(item.quantity) || 1,
      unit: null,
      taxRate: 0,
    };
  });
};

/**
 * Réception et traitement des messages entrants WhatsApp (POST)
 */
const handleIncomingWebhook = async (req, res) => {
  // Toujours accuser réception immédiatement avec un 200 OK pour Meta
  res.status(200).send("EVENT_RECEIVED");

  try {
    const body = req.body;

    if (!body.object || !body.entry || !body.entry[0]?.changes?.[0]?.value) {
      return;
    }

    const value = body.entry[0].changes[0].value;
    const messages = value.messages;

    if (!messages || messages.length === 0) {
      // Événements de statut (envoyé, distribué, lu)
      return;
    }

    const incomingMsg = messages[0];
    const fromPhone = incomingMsg.from; // ex: 22376123456
    const messageType = incomingMsg.type;

    let textContent = null;
    let audioBuffer = null;

    if (messageType === "text") {
      textContent = incomingMsg.text?.body;
    } else if (messageType === "audio") {
      const audioId = incomingMsg.audio?.id;
      if (audioId) {
        try {
          const mediaMeta = await whatsappService.getMediaMetadata(audioId);
          if (mediaMeta.url) {
            audioBuffer = await whatsappService.downloadMediaBinary(mediaMeta.url);
          }
        } catch (downloadErr) {
          console.error("Erreur téléchargement audio WhatsApp :", downloadErr);
          await whatsappService.sendTextMessage(
            fromPhone,
            "Désolé, je n'ai pas pu télécharger votre note vocale. Pouvez-vous la renvoyer ou écrire par texte ?"
          );
          return;
        }
      }
    } else {
      await whatsappService.sendTextMessage(
        fromPhone,
        "Bonjour ! Pour l'instant, je traite uniquement les messages écrits et les notes vocales."
      );
      return;
    }

    // 1. Identification du commerçant via son numéro de téléphone (derniers 8 chiffres pour le Mali)
    const localPhone = fromPhone.slice(-8);

    const businessProfile = await prisma.businessProfile.findFirst({
      where: {
        phone: {
          contains: localPhone,
        },
      },
      include: {
        user: {
          include: {
            products: { where: { isActive: true } },
            customers: true,
          },
        },
      },
    });

    if (!businessProfile || !businessProfile.user) {
      await whatsappService.sendTextMessage(
        fromPhone,
        `Bonjour ! Votre numéro (+${fromPhone}) n'est pas encore associé à une boutique sur Warifact.\n\nVeuillez renseigner ce numéro de téléphone dans votre profil d'entreprise sur votre tableau de bord Warifact pour activer le bot.`
      );
      return;
    }

    const user = businessProfile.user;

    // 2. Gestion de la session WhatsApp
    let session = await prisma.whatsAppSession.findUnique({
      where: { phoneNumber: fromPhone },
    });

    if (!session) {
      session = await prisma.whatsAppSession.create({
        data: {
          phoneNumber: fromPhone,
          userId: user.id,
          state: "IDLE",
        },
      });
    }

    // 3. Analyse du message par l'IA
    const aiResult = await aiInvoiceService.analyzeMerchantMessage({
      text: textContent,
      audioBuffer,
      businessName: businessProfile.businessName,
      currency: businessProfile.currency || "FCFA",
      products: user.products,
      customers: user.customers,
      currentDraft: session.draftData,
    });

    console.log("Action IA détectée :", aiResult.action);

    // 4. Exécution de l'action selon l'intention de l'IA

    // Action : ANNULATION DU BROUILLON
    if (aiResult.action === "CANCEL_DRAFT") {
      await prisma.whatsAppSession.update({
        where: { id: session.id },
        data: { state: "IDLE", draftData: null },
      });
      await whatsappService.sendTextMessage(
        fromPhone,
        " Le brouillon en cours a été annulé. Vous pouvez démarrer une nouvelle facture quand vous le souhaitez."
      );
      return;
    }

    // Action : CONFIRMATION & ÉMISSION DU PDF
    if (aiResult.action === "CONFIRM_INVOICE") {
      const draft = session.draftData;

      if (!draft || !draft.items || draft.items.length === 0) {
        await whatsappService.sendTextMessage(
          fromPhone,
          "Il n'y a aucun brouillon de facture en attente de validation.\n\nDites-moi ce que vous souhaitez facturer (ex: *2 sacs de riz pour Diarra*)."
        );
        return;
      }

      // Notification immédiate pour faire patienter pendant la génération
      await whatsappService.sendTextMessage(fromPhone, "⏳ Validation en cours et création de votre facture PDF...");

      // Création effective de la facture dans la base de données
      const createdInvoice = await prisma.$transaction(async (tx) => {
        const invoiceData = await buildInvoiceData({
          userId: user.id,
          body: {
            customerId: draft.customerId || null,
            customer: {
              name: draft.customerName || "Client Comptant",
              phone: draft.customerPhone || null,
            },
            items: draft.items,
            notes: draft.notes || null,
            type: "INVOICE",
          },
          db: tx,
        });

        const invoiceNumber = await generateInvoiceNumber({
          userId: user.id,
          type: "INVOICE",
          db: tx,
        });

        return await tx.invoice.create({
          data: {
            userId: user.id,
            customerId: invoiceData.customerSnapshot.customerId,
            invoiceNumber,
            type: "INVOICE",
            status: "ISSUED",
            customerName: invoiceData.customerSnapshot.customerName,
            customerPhone: invoiceData.customerSnapshot.customerPhone,
            customerEmail: invoiceData.customerSnapshot.customerEmail,
            customerAddress: invoiceData.customerSnapshot.customerAddress,
            customerCity: invoiceData.customerSnapshot.customerCity,
            customerCountry: invoiceData.customerSnapshot.customerCountry,
            subTotal: invoiceData.subTotal,
            taxTotal: invoiceData.taxTotal,
            total: invoiceData.total,
            notes: invoiceData.notes,
            items: {
              create: invoiceData.invoiceItems.map((item) => ({
                productId: item.productId,
                productName: item.productName,
                description: item.description,
                unitPrice: item.unitPrice,
                quantity: item.quantity,
                unit: item.unit,
                taxRate: item.taxRate,
                lineSubTotal: item.lineSubTotal,
                lineTaxTotal: item.lineTaxTotal,
                lineTotal: item.lineTotal,
              })),
            },
          },
          include: {
            items: true,
          },
        });
      });

      // Génération du PDF
      const { pdfUrl } = await generateInvoicePdf({
        invoice: createdInvoice,
        businessProfile,
      });

      await prisma.invoice.update({
        where: { id: createdInvoice.id },
        data: { pdfUrl },
      });

      // Réinitialiser la session
      await prisma.whatsAppSession.update({
        where: { id: session.id },
        data: { state: "IDLE", draftData: null },
      });

      // Construction de l'URL publique du PDF
      const baseUrl = process.env.APP_BASE_URL || "http://localhost:5000";
      const fullPdfUrl = pdfUrl.startsWith("http") ? pdfUrl : `${baseUrl}${pdfUrl}`;

      // Envoi du document PDF sur WhatsApp
      await whatsappService.sendDocumentMessage(
        fromPhone,
        fullPdfUrl,
        `Facture_${createdInvoice.invoiceNumber}.pdf`,
        `📄 Voici votre facture officielle N° ${createdInvoice.invoiceNumber} pour ${createdInvoice.customerName}.\nMontant Total : ${formatCurrency(createdInvoice.total, businessProfile.currency)}`
      );

      return;
    }

    // Action : CRÉATION OU MODIFICATION DE BROUILLON
    if (aiResult.action === "CREATE_DRAFT" || aiResult.action === "UPDATE_DRAFT") {
      let rawItems = aiResult.items || [];

      // Si c'est une mise à jour d'un brouillon existant et que l'IA n'a retourné que les changements,
      // on fusionne ou remplace intelligemment
      const resolvedItems = resolveItemsWithCatalog(rawItems, user.products);

      if (resolvedItems.length === 0) {
        await whatsappService.sendTextMessage(
          fromPhone,
          "Je n'ai pas bien identifié les articles. Pouvez-vous préciser les produits et quantités (ex: *3 bidons d'huile à 8 000 F*) ?"
        );
        return;
      }

      // Vérifier si des prix sont à 0 ou manquants
      const missingPriceItems = resolvedItems.filter((it) => !it.unitPrice || it.unitPrice <= 0);
      if (missingPriceItems.length > 0) {
        const names = missingPriceItems.map((it) => it.productName).join(", ");
        await whatsappService.sendTextMessage(
          fromPhone,
          `⚠️ Je n'ai pas trouvé le prix pour : *${names}*.\nQuel est le prix unitaire pour cet article ?`
        );
        return;
      }

      // Rapprochement du client existant si possible
      let matchedCustomer = null;
      if (aiResult.customer?.name) {
        const queryName = aiResult.customer.name.trim().toLowerCase();
        matchedCustomer = user.customers.find((c) => c.name.toLowerCase().includes(queryName));
      }

      const draftPayload = {
        customerId: matchedCustomer ? matchedCustomer.id : null,
        customerName: matchedCustomer ? matchedCustomer.name : (aiResult.customer?.name || "Client Comptant"),
        customerPhone: aiResult.customer?.phone || (matchedCustomer ? matchedCustomer.phone : null),
        items: resolvedItems,
        notes: aiResult.notes || null,
      };

      // Calcul déterministe des totaux via buildInvoiceData
      const calculatedData = await buildInvoiceData({
        userId: user.id,
        body: {
          customerId: draftPayload.customerId,
          customer: {
            name: draftPayload.customerName,
            phone: draftPayload.customerPhone,
          },
          items: resolvedItems,
          notes: draftPayload.notes,
        },
        db: prisma,
      });

      // Sauvegarde dans la session
      await prisma.whatsAppSession.update({
        where: { id: session.id },
        data: {
          state: "DRAFT_PENDING",
          draftData: {
            ...draftPayload,
            subTotal: calculatedData.subTotal,
            taxTotal: calculatedData.taxTotal,
            total: calculatedData.total,
          },
        },
      });

      // Message WhatsApp récapitulatif pour le boutiquier
      const linesText = calculatedData.invoiceItems
        .map((it) => `• ${it.quantity} × ${it.productName} (${formatCurrency(it.unitPrice, businessProfile.currency)}) = *${formatCurrency(it.lineTotal, businessProfile.currency)}*`)
        .join("\n");

      const responseText = `📋 *Aperçu de la Facture*\n👤 Client : *${draftPayload.customerName}*\n\n${linesText}\n\n💰 *TOTAL : ${formatCurrency(calculatedData.total, businessProfile.currency)}*\n\n👉 Répondez *"Valider"* pour émettre le PDF officiel, ou dites-moi ce qu'il faut modifier.`;

      await whatsappService.sendTextMessage(fromPhone, responseText);
      return;
    }

    // Action : QUESTION GÉNÉRALE OU SALUTATION
    const replyText =
      aiResult.friendlyMessage ||
      "Bonjour ! Je suis votre assistant de facturation Warifact. Pour créer une facture, envoyez-moi simplement un message ou une note vocale (ex: *Facture 3 sacs de ciment pour Traoré*).";

    await whatsappService.sendTextMessage(fromPhone, replyText);
  } catch (error) {
    console.error("Erreur handleIncomingWebhook :", error);
  }
};

module.exports = {
  handleWebhookVerification,
  handleIncomingWebhook,
};
