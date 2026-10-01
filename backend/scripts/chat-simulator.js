/**
 * Simulateur interactif de Chatbot WhatsApp pour Warifact
 * Permet de discuter avec l'assistant comme si on était sur WhatsApp !
 * Exécution : node scripts/chat-simulator.js
 */

require("dotenv").config();
const readline = require("readline");
const prisma = require("../src/config/prisma");
const aiInvoiceService = require("../src/services/aiInvoice.service");
const { buildInvoiceData, generateInvoiceNumber } = require("../src/controllers/invoice.controller");
const { generateInvoicePdf } = require("../src/services/invoicePdf.service");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const promptQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

const formatCurrency = (amount, currency = "FCFA") => {
  return `${Math.round(amount).toLocaleString("fr-FR")} ${currency}`;
};

async function startSimulator() {
  console.log("\n==============================================================");
  console.log(" 📱 SIMULATEUR WHATSAPP - ASSISTANT IA WARIFACT");
  console.log("==============================================================\n");

  // 1. Trouver une boutique
  const businessProfile = await prisma.businessProfile.findFirst({
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
    console.error("❌ Aucune boutique trouvée en base de données. Créez-en une d'abord.");
    process.exit(1);
  }

  const user = businessProfile.user;
  const phoneNumber = businessProfile.phone ? businessProfile.phone.replace(/[^0-9]/g, "") : "22376000000";

  console.log(`🏪 Boutique active : "${businessProfile.businessName}"`);
  console.log(`📞 Numéro WhatsApp simulé : +${phoneNumber}`);
  console.log(`📦 Catalogue : ${user.products.map((p) => `${p.name} (${p.unitPrice} F)`).join(", ") || "(Vide)"}`);
  console.log(`👥 Clients : ${user.customers.map((c) => c.name).join(", ") || "(Aucun)"}`);
  console.log(`🤖 Fournisseur IA configuré : ${process.env.AI_PROVIDER || "gemini"}`);
  console.log("\n💬 Vous pouvez maintenant écrire des messages comme sur WhatsApp !");
  console.log("Exemples à tester :");
  console.log("  • 'Fais une facture de 3 sacs riz pour Awa Traoré'");
  console.log("  • 'Ajoute 2000f de remise'");
  console.log("  • 'C'est bon, valide'");
  console.log("  • 'Annule le brouillon'");
  console.log("Tapez 'quitter' pour arrêter.\n");

  // Récupérer ou créer la session
  let session = await prisma.whatsAppSession.findUnique({
    where: { phoneNumber },
  });

  if (!session) {
    session = await prisma.whatsAppSession.create({
      data: {
        phoneNumber,
        userId: user.id,
        state: "IDLE",
      },
    });
  }

  while (true) {
    const userInput = await promptQuestion("\n👤 Vous (WhatsApp) : ");

    if (!userInput || userInput.trim().toLowerCase() === "quitter") {
      console.log("\n👋 Fermeture du simulateur. À bientôt !");
      break;
    }

    const messageText = userInput.trim();

    // Recharger la session à jour
    session = await prisma.whatsAppSession.findUnique({ where: { phoneNumber } });

    console.log("\n⏳ Analyse en cours par l'assistant...");

    try {
      let aiResult;
      const hasKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

      if (hasKey) {
        aiResult = await aiInvoiceService.analyzeMerchantMessage({
          text: messageText,
          businessName: businessProfile.businessName,
          currency: businessProfile.currency || "FCFA",
          products: user.products,
          customers: user.customers,
          currentDraft: session.draftData,
        });
      } else {
        // Mode démonstration hors ligne intelligent si pas de clé configurée
        const lower = messageText.toLowerCase();
        if (lower.includes("valide") || lower.includes("c'est bon") || lower.includes("envoie")) {
          aiResult = { action: "CONFIRM_INVOICE" };
        } else if (lower.includes("annule") || lower.includes("efface")) {
          aiResult = { action: "CANCEL_DRAFT" };
        } else {
          // Détection d'une quantité éventuelle dans le texte
          const qtyMatch = messageText.match(/(\d+)/);
          const detectedQty = qtyMatch ? Number(qtyMatch[1]) : 3;

          // Détection d'un nom de client éventuel
          let detectedCustomer = "Awa Traoré";
          if (lower.includes("pour")) {
            const parts = messageText.split(/pour/i);
            if (parts[1]) detectedCustomer = parts[1].split(/[:\n,.]/)[0].trim();
          }

          aiResult = {
            action: "CREATE_DRAFT",
            customer: { name: detectedCustomer },
            items: [{ productName: "sac riz", quantity: detectedQty, unitPrice: 2800 }],
            notes: null,
            friendlyMessage: `Je prépare votre facture pour ${detectedCustomer}.`,
          };
        }
      }

      // Exécution des actions
      if (aiResult.action === "CANCEL_DRAFT") {
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: { state: "IDLE", draftData: null },
        });
        console.log("🤖 Assistant WhatsApp :");
        console.log("❌ Le brouillon en cours a été annulé.");
        continue;
      }

      if (aiResult.action === "CONFIRM_INVOICE") {
        const draft = session.draftData;
        if (!draft || !draft.items || draft.items.length === 0) {
          console.log("🤖 Assistant WhatsApp :");
          console.log("⚠️ Il n'y a aucun brouillon en cours. Indiquez d'abord les articles à facturer.");
          continue;
        }

        console.log("⚙️ Émission officielle de la facture et génération du PDF...");

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
              subTotal: invoiceData.subTotal,
              taxTotal: invoiceData.taxTotal,
              total: invoiceData.total,
              notes: invoiceData.notes,
              items: {
                create: invoiceData.invoiceItems.map((item) => ({
                  productId: item.productId,
                  productName: item.productName,
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
            include: { items: true },
          });
        });

        const { pdfUrl } = await generateInvoicePdf({
          invoice: createdInvoice,
          businessProfile,
        });

        await prisma.invoice.update({
          where: { id: createdInvoice.id },
          data: { pdfUrl },
        });

        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: { state: "IDLE", draftData: null },
        });

        console.log("🤖 Assistant WhatsApp :");
        console.log(`📄 [DOCUMENT ENVOYÉ] Facture_${createdInvoice.invoiceNumber}.pdf`);
        console.log(`✅ Facture N° ${createdInvoice.invoiceNumber} enregistrée avec succès !`);
        console.log(`💰 Montant : ${formatCurrency(createdInvoice.total, businessProfile.currency)}`);
        console.log(`📁 Fichier PDF généré : backend${pdfUrl}`);
        continue;
      }

      if (aiResult.action === "CREATE_DRAFT" || aiResult.action === "UPDATE_DRAFT") {
        const rawItems = aiResult.items || [];
        const items = rawItems.map((it) => {
          const match = user.products.find((p) => p.name.toLowerCase().includes(it.productName.toLowerCase()));
          return {
            productId: match ? match.id : null,
            productName: match ? match.name : it.productName,
            unitPrice: it.unitPrice || (match ? match.unitPrice : 0),
            quantity: Number(it.quantity) || 1,
            unit: match ? match.unit : null,
            taxRate: match ? match.taxRate || 0 : 0,
          };
        });

        const calculated = await buildInvoiceData({
          userId: user.id,
          body: {
            customer: { name: aiResult.customer?.name || "Client Comptant" },
            items,
          },
          db: prisma,
        });

        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: {
            state: "DRAFT_PENDING",
            draftData: {
              customerName: calculated.customerSnapshot.customerName,
              items: calculated.invoiceItems,
              subTotal: calculated.subTotal,
              total: calculated.total,
            },
          },
        });

        console.log("🤖 Assistant WhatsApp :");
        console.log(`📋 *Aperçu de la Facture*`);
        console.log(`👤 Client : ${calculated.customerSnapshot.customerName}`);
        for (const item of calculated.invoiceItems) {
          console.log(`  • ${item.quantity} × ${item.productName} (${formatCurrency(item.unitPrice)}) = ${formatCurrency(item.lineTotal)}`);
        }
        console.log(`💰 *TOTAL : ${formatCurrency(calculated.total, businessProfile.currency)}*`);
        console.log(`👉 Répondez "Valider" pour générer la facture officielle, ou indiquez vos modifications.`);
        continue;
      }

      console.log("🤖 Assistant WhatsApp :");
      console.log(aiResult.friendlyMessage || "Bonjour ! Dites-moi ce que vous souhaitez facturer.");
    } catch (err) {
      console.error("❌ Erreur traitement :", err.message);
    }
  }

  rl.close();
  await prisma.$disconnect();
}

startSimulator();
