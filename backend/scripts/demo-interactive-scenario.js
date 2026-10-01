/**
 * Scénario de démonstration du flux conversationnel WhatsApp
 * Exécute les 3 étapes d'une vente type en boutique malienne :
 * 1. Demande de facture ("4 sacs de riz pour Awa Traoré")
 * 2. Demande de modification ("Fais une remise de 1 200 FCFA")
 * 3. Validation ("C'est bon, valide") -> Génération et lien du PDF officiel
 */

require("dotenv").config();
const prisma = require("../src/config/prisma");
const { buildInvoiceData, generateInvoiceNumber } = require("../src/controllers/invoice.controller");
const { generateInvoicePdf } = require("../src/services/invoicePdf.service");

const formatCurrency = (amount, currency = "FCFA") => {
  return `${Math.round(amount).toLocaleString("fr-FR")} ${currency}`;
};

async function runDemoScenario() {
  console.log("=================================================================");
  console.log(" 📱 SCÉNARIO DÉMONSTRATION DU CHATBOT WHATSAPP WARIFACT");
  console.log("=================================================================\n");

  // Charger la boutique
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
    console.error("❌ Boutique introuvable");
    return;
  }

  const user = businessProfile.user;
  const phoneNumber = businessProfile.phone ? businessProfile.phone.replace(/[^0-9]/g, "") : "22376000000";

  console.log(`🏪 Boutique : "${businessProfile.businessName}"`);
  console.log(`📞 Numéro WhatsApp Commerçant : +${phoneNumber}\n`);

  // Réinitialiser la session de test
  await prisma.whatsAppSession.upsert({
    where: { phoneNumber },
    update: { state: "IDLE", draftData: null },
    create: { phoneNumber, userId: user.id, state: "IDLE" },
  });

  // -------------------------------------------------------------
  // ÉTAPE 1 : Le commerçant demande un brouillon
  // -------------------------------------------------------------
  console.log("-----------------------------------------------------------------");
  console.log("Étape 1 : Le boutiquier envoie un message (texte ou vocal)");
  console.log("👤 Boutiquier (WhatsApp) : \"Bonjour, prépare-moi une facture pour Awa Traoré : 4 sacs de riz\"");
  console.log("-----------------------------------------------------------------");

  // Rapprochement avec le produit catalogue
  const product = user.products.find((p) => p.name.toLowerCase().includes("riz")) || user.products[0];
  const customer = user.customers.find((c) => c.name.toLowerCase().includes("awa")) || { name: "Awa Traoré" };

  const quantity = 4;
  const unitPrice = product ? product.unitPrice : 2800;

  // Calcul strict par Warifact
  const draftCalc1 = await buildInvoiceData({
    userId: user.id,
    body: {
      customerId: customer.id || null,
      customer: { name: customer.name, phone: customer.phone || null },
      items: [
        {
          productId: product ? product.id : null,
          productName: product ? product.name : "Sac riz",
          unitPrice,
          quantity,
        },
      ],
    },
    db: prisma,
  });

  // Sauvegarde session
  await prisma.whatsAppSession.update({
    where: { phoneNumber },
    data: {
      state: "DRAFT_PENDING",
      draftData: {
        customerId: customer.id || null,
        customerName: customer.name,
        customerPhone: customer.phone || null,
        items: draftCalc1.invoiceItems,
        subTotal: draftCalc1.subTotal,
        total: draftCalc1.total,
        discount: 0,
      },
    },
  });

  console.log("🤖 Assistant WhatsApp :");
  console.log(`📋 *Aperçu de la Facture*`);
  console.log(`👤 Client : *${customer.name}*`);
  console.log(`• ${quantity} × ${product.name} (${formatCurrency(unitPrice)}) = *${formatCurrency(draftCalc1.total)}*`);
  console.log(`💰 *TOTAL : ${formatCurrency(draftCalc1.total)}*`);
  console.log(`👉 Répondez *"Valider"* pour émettre le PDF officiel, ou indiquez vos modifications.\n`);

  // -------------------------------------------------------------
  // ÉTAPE 2 : Le commerçant demande une modification
  // -------------------------------------------------------------
  console.log("-----------------------------------------------------------------");
  console.log("Étape 2 : Le boutiquier demande un ajustement");
  console.log("👤 Boutiquier (WhatsApp) : \"Fais-lui 1 200 FCFA de remise spéciale\"");
  console.log("-----------------------------------------------------------------");

  const discount = 1200;
  const newTotal = draftCalc1.subTotal - discount;

  await prisma.whatsAppSession.update({
    where: { phoneNumber },
    data: {
      draftData: {
        customerId: customer.id || null,
        customerName: customer.name,
        customerPhone: customer.phone || null,
        items: draftCalc1.invoiceItems,
        subTotal: draftCalc1.subTotal,
        discount,
        total: newTotal,
        notes: `Remise spéciale accordée : ${formatCurrency(discount)}`,
      },
    },
  });

  console.log("🤖 Assistant WhatsApp :");
  console.log(`📋 *Aperçu mis à jour*`);
  console.log(`👤 Client : *${customer.name}*`);
  console.log(`• ${quantity} × ${product.name} : ${formatCurrency(draftCalc1.subTotal)}`);
  console.log(`🏷️ Remise spéciale : -${formatCurrency(discount)}`);
  console.log(`💰 *NOUVEAU TOTAL : ${formatCurrency(newTotal)}*`);
  console.log(`👉 Répondez *"Valider"* pour sortir le document PDF.\n`);

  // -------------------------------------------------------------
  // ÉTAPE 3 : Validation et émission du document officiel
  // -------------------------------------------------------------
  console.log("-----------------------------------------------------------------");
  console.log("Étape 3 : Le boutiquier confirme la vente");
  console.log("👤 Boutiquier (WhatsApp) : \"C'est bon, valide et sors la facture\"");
  console.log("-----------------------------------------------------------------");

  console.log("⚙️ Émission de la facture et création du PDF officiel...");

  const createdInvoice = await prisma.$transaction(async (tx) => {
    const invoiceNumber = await generateInvoiceNumber({
      userId: user.id,
      type: "INVOICE",
      db: tx,
    });

    return await tx.invoice.create({
      data: {
        userId: user.id,
        customerId: customer.id || null,
        invoiceNumber,
        type: "INVOICE",
        status: "ISSUED",
        customerName: customer.name,
        customerPhone: customer.phone || null,
        subTotal: draftCalc1.subTotal,
        taxTotal: 0,
        total: newTotal,
        notes: `Remise spéciale accordée : ${formatCurrency(discount)}`,
        items: {
          create: draftCalc1.invoiceItems.map((it) => ({
            productId: it.productId,
            productName: it.productName,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            unit: it.unit,
            taxRate: 0,
            lineSubTotal: it.lineSubTotal,
            lineTaxTotal: 0,
            lineTotal: it.lineTotal,
          })),
        },
      },
      include: { items: true },
    });
  });

  // Génération du PDF avec PDFKit et QR code
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
    where: { phoneNumber },
    data: { state: "IDLE", draftData: null },
  });

  console.log("\n🤖 Assistant WhatsApp :");
  console.log(`📄 [FICHIER PDF ENVOYÉ DANS LA DISCUSSION] : Facture_${createdInvoice.invoiceNumber}.pdf`);
  console.log(`✅ Facture officielle émise : N° ${createdInvoice.invoiceNumber}`);
  console.log(`💰 Montant encaissé : ${formatCurrency(createdInvoice.total)}`);
  console.log(`🔗 Chemin du PDF généré : backend${pdfUrl}`);
  console.log("\n🎉 FLUX COMPLET VALIDÉ SANS ERREUR !");
}

runDemoScenario()
  .catch((e) => console.error("Erreur scenario :", e))
  .finally(() => prisma.$disconnect());
