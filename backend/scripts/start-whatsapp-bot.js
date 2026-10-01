/**
 * Connecteur WhatsApp Web pour Warifact (Scan QR Code)
 * Permet de connecter un compte WhatsApp directement via QR code sans passer par Meta Cloud API.
 * Lancement : node scripts/start-whatsapp-bot.js
 */

require("dotenv").config();
const path = require("path");
const fs = require("fs");
const pino = require("pino");
const qrcode = require("qrcode-terminal");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  downloadMediaMessage,
} = require("@whiskeysockets/baileys");

const prisma = require("../src/config/prisma");
const aiInvoiceService = require("../src/services/aiInvoice.service");
const { buildInvoiceData, generateInvoiceNumber } = require("../src/controllers/invoice.controller");
const { generateInvoicePdf } = require("../src/services/invoicePdf.service");

const AUTH_FOLDER = path.join(__dirname, "../whatsapp_session_auth");

const formatCurrency = (amount, currency = "FCFA") => {
  return `${Math.round(amount).toLocaleString("fr-FR")} ${currency}`;
};

/**
 * Rapproche les articles détectés avec le catalogue
 */
const resolveItemsWithCatalog = (extractedItems = [], catalogProducts = []) => {
  return extractedItems.map((item) => {
    const cleanItemName = (item.productName || "").trim().toLowerCase();

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

    return {
      productId: null,
      productName: item.productName || "Article",
      description: null,
      unitPrice: Number(item.unitPrice) || 0,
      quantity: Number(item.quantity) || 1,
      unit: null,
      taxRate: 0,
    };
  });
};

async function connectToWhatsApp() {
  console.log("\n==============================================================");
  console.log(" 📱 CONNEXION WHATSAPP WEB - ASSISTANT IA WARIFACT");
  console.log("==============================================================\n");

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false, // On le gère nous-mêmes avec qrcode-terminal
  });

  sock.ev.on("creds.update", saveCreds);

  // Gestion des événements de connexion
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n👉 Scannez ce QR Code avec WhatsApp sur votre smartphone :");
      console.log("(Dans WhatsApp : Paramètres > Appareils connectés > Connecter un appareil)\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`⚠️ Connexion interrompue (Code: ${statusCode}). Reconnexion : ${shouldReconnect}`);

      if (shouldReconnect) {
        connectToWhatsApp();
      } else {
        console.log("❌ Déconnecté de WhatsApp. Relancez le script pour scanner un nouveau QR code.");
      }
    } else if (connection === "open") {
      console.log("\n==============================================================");
      console.log(" 🎉 CONNECTÉ À WHATSAPP AVEC SUCCÈS !");
      console.log(" 🤖 L'assistant Warifact écoute vos messages et notes vocales.");
      console.log("==============================================================\n");
    }
  });

  // Gestion des messages entrants
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message) continue;

      const remoteJid = msg.key.remoteJid;
      // Ignorer les statuts et messages de groupe
      if (!remoteJid || remoteJid.endsWith("@g.us") || remoteJid === "status@broadcast") {
        continue;
      }

      // Extraction du texte ou du vocal
      let textContent =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        null;

      let audioBuffer = null;

      if (msg.message.audioMessage) {
        try {
          console.log("🎤 Note vocale reçue, téléchargement en cours...");
          audioBuffer = await downloadMediaMessage(msg, "buffer", {});
        } catch (err) {
          console.error("Erreur téléchargement audio :", err);
          await sock.sendMessage(remoteJid, {
            text: "Désolé, je n'ai pas pu lire votre note vocale. Pouvez-vous écrire par texte ?",
          });
          continue;
        }
      }

      if (!textContent && !audioBuffer) continue;

      const senderPhone = remoteJid.replace(/[^0-9]/g, "");
      console.log(`\n📩 Message reçu de +${senderPhone} : ${textContent || "[Note vocale]"}`);

      // 1. Identifier la boutique (via les 8 derniers chiffres du numéro ou première boutique par défaut)
      const localPhone = senderPhone.slice(-8);

      let businessProfile = await prisma.businessProfile.findFirst({
        where: {
          phone: { contains: localPhone },
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

      // Si non trouvé par numéro exact, on charge la boutique principale pour les tests
      if (!businessProfile || !businessProfile.user) {
        businessProfile = await prisma.businessProfile.findFirst({
          include: {
            user: {
              include: {
                products: { where: { isActive: true } },
                customers: true,
              },
            },
          },
        });
      }

      if (!businessProfile || !businessProfile.user) {
        await sock.sendMessage(remoteJid, {
          text: "Aucune boutique Warifact n'est configurée. Connectez-vous sur votre espace web pour créer votre profil.",
        });
        continue;
      }

      const user = businessProfile.user;

      // 2. Gestion de la session
      let session = await prisma.whatsAppSession.findUnique({
        where: { phoneNumber: senderPhone },
      });

      if (!session) {
        session = await prisma.whatsAppSession.create({
          data: {
            phoneNumber: senderPhone,
            userId: user.id,
            state: "IDLE",
          },
        });
      }

      // Indiquer à WhatsApp que le bot est en train d'écrire
      await sock.sendPresenceUpdate("composing", remoteJid);

      try {
        // 3. Appel de l'IA (OpenAI ou Gemini selon .env)
        const aiResult = await aiInvoiceService.analyzeMerchantMessage({
          text: textContent,
          audioBuffer,
          businessName: businessProfile.businessName,
          currency: businessProfile.currency || "FCFA",
          products: user.products,
          customers: user.customers,
          currentDraft: session.draftData,
        });

        console.log("🤖 Action IA identifiée :", aiResult.action);

        // 4. Traitement de l'action

        // A. Annulation
        if (aiResult.action === "CANCEL_DRAFT") {
          await prisma.whatsAppSession.update({
            where: { id: session.id },
            data: { state: "IDLE", draftData: null },
          });
          await sock.sendMessage(remoteJid, {
            text: "❌ Le brouillon en cours a été annulé. Vous pouvez démarrer une nouvelle facture quand vous le souhaitez.",
          });
          continue;
        }

        // B. Confirmation & Génération de Facture PDF
        if (aiResult.action === "CONFIRM_INVOICE") {
          const draft = session.draftData;

          if (!draft || !draft.items || draft.items.length === 0) {
            await sock.sendMessage(remoteJid, {
              text: "⚠️ Il n'y a aucun brouillon en attente de validation. Dites-moi ce que vous souhaitez facturer (ex: *2 sacs de riz pour Diarra*).",
            });
            continue;
          }

          await sock.sendMessage(remoteJid, {
            text: "⏳ Validation en cours... Je génère votre facture PDF officielle.",
          });

          // Création dans la base de données
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
              include: { items: true },
            });
          });

          // Génération PDF
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

          // Envoi direct du fichier PDF via WhatsApp Web !
          const localPdfPath = path.join(__dirname, "..", pdfUrl);

          if (fs.existsSync(localPdfPath)) {
            const pdfBuffer = fs.readFileSync(localPdfPath);
            await sock.sendMessage(remoteJid, {
              document: pdfBuffer,
              mimetype: "application/pdf",
              fileName: `Facture_${createdInvoice.invoiceNumber}.pdf`,
              caption: `📄 Voici votre facture officielle N° ${createdInvoice.invoiceNumber} pour ${createdInvoice.customerName}.\n💰 Total : ${formatCurrency(createdInvoice.total, businessProfile.currency)}\n\nElle contient vos coordonnées de paiement Mobile Money.`,
            });
            console.log(`✅ Facture PDF envoyée à +${senderPhone}`);
          } else {
            await sock.sendMessage(remoteJid, {
              text: `✅ Facture N° ${createdInvoice.invoiceNumber} validée ! (Montant : ${formatCurrency(createdInvoice.total)})`,
            });
          }
          continue;
        }

        // C. Création ou Modification de Brouillon
        if (aiResult.action === "CREATE_DRAFT" || aiResult.action === "UPDATE_DRAFT") {
          const rawItems = aiResult.items || [];
          const resolvedItems = resolveItemsWithCatalog(rawItems, user.products);

          if (resolvedItems.length === 0) {
            await sock.sendMessage(remoteJid, {
              text: "Je n'ai pas bien compris les articles. Pouvez-vous préciser les produits et quantités (ex: *2 sacs de riz à 2 800 F*) ?",
            });
            continue;
          }

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

          const calculated = await buildInvoiceData({
            userId: user.id,
            body: {
              customerId: draftPayload.customerId,
              customer: { name: draftPayload.customerName, phone: draftPayload.customerPhone },
              items: resolvedItems,
              notes: draftPayload.notes,
            },
            db: prisma,
          });

          await prisma.whatsAppSession.update({
            where: { id: session.id },
            data: {
              state: "DRAFT_PENDING",
              draftData: {
                ...draftPayload,
                subTotal: calculated.subTotal,
                taxTotal: calculated.taxTotal,
                total: calculated.total,
              },
            },
          });

          const linesText = calculated.invoiceItems
            .map((it) => `• ${it.quantity} × ${it.productName} (${formatCurrency(it.unitPrice, businessProfile.currency)}) = *${formatCurrency(it.lineTotal, businessProfile.currency)}*`)
            .join("\n");

          const responseMsg = `📋 *Aperçu de la Facture*\n👤 Client : *${draftPayload.customerName}*\n\n${linesText}\n\n💰 *TOTAL : ${formatCurrency(calculated.total, businessProfile.currency)}*\n\n👉 Répondez *"Valider"* pour émettre le document PDF officiel, ou indiquez vos modifications.`;

          await sock.sendMessage(remoteJid, { text: responseMsg });
          continue;
        }

        // D. Réponse générale
        await sock.sendMessage(remoteJid, {
          text:
            aiResult.friendlyMessage ||
            "Bonjour ! Je suis votre assistant Warifact. Envoyez-moi un texte ou une note vocale pour faire une facture (ex: *Facture 3 sacs de riz pour Traoré*).",
        });
      } catch (procErr) {
        console.error("Erreur traitement message :", procErr);
        await sock.sendMessage(remoteJid, {
          text: "Une erreur est survenue lors de l'analyse de votre message. Pouvez-vous reformuler ?",
        });
      }
    }
  });
}

connectToWhatsApp().catch((err) => console.error("Erreur au lancement de WhatsApp Web :", err));
