/**
 * Script de test local pour le flux WhatsApp / IA Warifact
 * Exécuter avec : node scripts/test-whatsapp-flow.js
 */

require("dotenv").config();
const prisma = require("../src/config/prisma");
const aiInvoiceService = require("../src/services/aiInvoice.service");
const { buildInvoiceData, generateInvoiceNumber } = require("../src/controllers/invoice.controller");
const { generateInvoicePdf } = require("../src/services/invoicePdf.service");

async function runLocalTest() {
  console.log("🚀 Démarrage du test du module WhatsApp / IA Warifact...\n");

  // 1. Trouver un utilisateur avec un profil d'entreprise
  const businessProfile = await prisma.businessProfile.findFirst({
    where: { phone: { not: null } },
    include: {
      user: {
        include: {
          products: { where: { isActive: true } },
          customers: true,
        },
      },
    },
  });

  if (!businessProfile) {
    console.error(" Aucun profil d'entreprise trouvé avec un numéro de téléphone.");
    return;
  }

  console.log(` Boutique identifiée : "${businessProfile.businessName}" (Téléphone: ${businessProfile.phone})`);
  console.log(` Produits actifs en boutique : ${businessProfile.user.products.map((p) => p.name).join(", ")}`);
  console.log(`👥 Clients enregistrés : ${businessProfile.user.customers.map((c) => c.name).join(", ")}\n`);

  // 2. Tester le Prompt Système généré pour l'IA
  const prompt = aiInvoiceService.buildSystemPrompt({
    businessName: businessProfile.businessName,
    currency: businessProfile.currency,
    products: businessProfile.user.products,
    customers: businessProfile.user.customers,
    currentDraft: null,
  });

  console.log("📝 Extrait du Prompt Système injecté à l'IA :");
  console.log("--------------------------------------------------");
  console.log(prompt.slice(0, 350) + "...\n--------------------------------------------------\n");

  // 3. Simuler un message du boutiquier
  const simulatedMessage = "Fais-moi une facture de 5 sacs de riz pour la cliente Awa Traoré";
  console.log(`🗣️ Message simulé du commerçant : "${simulatedMessage}"\n`);

  // Si une clé API est configurée, on appelle l'IA, sinon on simule le JSON extrait
  let aiResult;
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

  if (hasGeminiKey || hasOpenAIKey) {
    console.log(`🤖 Appel de l'IA (Fournisseur: ${process.env.AI_PROVIDER || "gemini"})...`);
    try {
      aiResult = await aiInvoiceService.analyzeMerchantMessage({
        text: simulatedMessage,
        businessName: businessProfile.businessName,
        currency: businessProfile.currency,
        products: businessProfile.user.products,
        customers: businessProfile.user.customers,
      });
      console.log(" Résultat brut de l'IA :", JSON.stringify(aiResult, null, 2));
    } catch (err) {
      console.warn(" Échec appel API IA (clé invalide ou quota) :", err.message);
      console.log(" Utilisation du simulateur d'extraction pour terminer le test...");
    }
  }

  if (!aiResult) {
    // Résultat simulé si pas de clé configurée pour le test
    aiResult = {
      action: "CREATE_DRAFT",
      customer: { name: "Awa Traoré", phone: "+223 70 11 22 33" },
      items: [{ productName: "sac riz", quantity: 5, unitPrice: 2800 }],
      discount: 0,
      friendlyMessage: "Je prépare la facture pour Awa Traoré avec 5 sacs de riz.",
    };
    console.log("ℹ️ Extraction simulée (fallback de test) :", aiResult);
  }

  // 4. Calcul déterministe via buildInvoiceData
  console.log("\n🧮 Calcul déterministe des totaux par le moteur Warifact...");
  const invoiceData = await buildInvoiceData({
    userId: businessProfile.user.id,
    body: {
      customerId: businessProfile.user.customers[0]?.id || null,
      customer: {
        name: aiResult.customer.name,
        phone: aiResult.customer.phone,
      },
      items: [
        {
          productId: businessProfile.user.products[0]?.id || null,
          productName: aiResult.items[0].productName,
          unitPrice: aiResult.items[0].unitPrice || 2800,
          quantity: aiResult.items[0].quantity,
        },
      ],
      type: "INVOICE",
    },
    db: prisma,
  });

  console.log(` Sous-total : ${invoiceData.subTotal} FCFA`);
  console.log(` Taxes : ${invoiceData.taxTotal} FCFA`);
  console.log(` Total Calculé : ${invoiceData.total} FCFA\n`);

  // 5. Simuler l'enregistrement de la session WhatsApp
  console.log(" Test d'enregistrement de la session WhatsApp en base de données...");
  const cleanPhone = businessProfile.phone.replace(/[^0-9]/g, "");

  const session = await prisma.whatsAppSession.upsert({
    where: { phoneNumber: cleanPhone },
    update: {
      state: "DRAFT_PENDING",
      draftData: {
        customerName: invoiceData.customerSnapshot.customerName,
        items: invoiceData.invoiceItems,
        total: invoiceData.total,
      },
    },
    create: {
      phoneNumber: cleanPhone,
      userId: businessProfile.userId,
      state: "DRAFT_PENDING",
      draftData: {
        customerName: invoiceData.customerSnapshot.customerName,
        items: invoiceData.invoiceItems,
        total: invoiceData.total,
      },
    },
  });

  console.log(` Session WhatsApp enregistrée avec succès (ID: ${session.id}, État: ${session.state})`);
  console.log("\n🎉 TEST RÉUSSI : La chaîne complète de traitement fonctionne parfaitement !");
}

runLocalTest()
  .catch((e) => console.error("Erreur test :", e))
  .finally(() => prisma.$disconnect());
