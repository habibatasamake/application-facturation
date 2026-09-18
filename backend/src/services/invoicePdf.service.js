const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const { getAccentColorFromLogo } = require("./brandColor.service");

const TEXT_COLOR = "#1C1215";
const MUTED_TEXT = "#695A60";
const LIGHT_GRAY = "#FAF7F2";
const BORDER_COLOR = "#E8DFD5";

const formatAmount = (amount, currency = "FCFA") => {
  const value = Number(amount || 0);

  const formattedValue = value
    .toLocaleString("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
    .replace(/\u202F/g, " ")
    .replace(/\u00A0/g, " ");

  return `${formattedValue} ${currency}`;
};

const formatDate = (date) => {
  if (!date) return new Date().toLocaleDateString("fr-FR");
  return new Date(date).toLocaleDateString("fr-FR");
};

const generatePaymentQrCode = async ({ invoice, businessProfile }) => {
  try {
    let qrData = "";

    // Si un lien direct Wave est renseigné
    if (businessProfile?.waveNumber && businessProfile.waveNumber.startsWith("http")) {
      qrData = businessProfile.waveNumber;
    } else {
      const payDetails = [];
      if (businessProfile?.waveNumber) payDetails.push(`Wave:${businessProfile.waveNumber}`);
      if (businessProfile?.orangeMoneyNumber) payDetails.push(`OM:${businessProfile.orangeMoneyNumber}`);
      if (businessProfile?.momoNumber) payDetails.push(`MoMo:${businessProfile.momoNumber}`);

      const payStr = payDetails.length > 0 ? payDetails.join(" | ") : `Tel:${businessProfile?.phone || ""}`;
      qrData = `WariFact | Doc: ${invoice.invoiceNumber} | Montant: ${formatAmount(invoice.total, businessProfile?.currency || "FCFA")} | ${payStr}`;
    }

    return await QRCode.toBuffer(qrData, {
      width: 140,
      margin: 1,
      color: {
        dark: "#1C1215",
        light: "#FFFFFF",
      },
    });
  } catch (error) {
    console.error("Erreur génération QR Code:", error);
    return null;
  }
};

const drawLogo = (doc, businessProfile, x, y) => {
  if (!businessProfile?.logoUrl) {
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(TEXT_COLOR)
      .text(businessProfile?.businessName || "COMMERCE", x, y);
    return;
  }

  const logoPath = path.join(
    __dirname,
    "../..",
    businessProfile.logoUrl.replace(/^\/+/, "")
  );

  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, x, y, {
        fit: [100, 50],
      });
    } catch (e) {
      doc
        .font("Helvetica-Bold")
        .fontSize(16)
        .fillColor(TEXT_COLOR)
        .text(businessProfile?.businessName || "COMMERCE", x, y);
    }
  } else {
    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(TEXT_COLOR)
      .text(businessProfile?.businessName || "COMMERCE", x, y);
  }
};

const drawHeader = (doc, invoice, businessProfile, accentColor) => {
  const isQuote = invoice.type === "QUOTE";
  const title = isQuote ? "DEVIS" : "FACTURE";
  const numberLabel = isQuote ? "Devis N°" : "Facture N°";

  drawLogo(doc, businessProfile, 40, 35);

  doc
    .font("Helvetica-Bold")
    .fontSize(24)
    .fillColor(accentColor)
    .text(title, 340, 35, {
      width: 215,
      align: "right",
    });

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor(TEXT_COLOR)
    .text(`${numberLabel} : ${invoice.invoiceNumber}`, 340, 68, {
      width: 215,
      align: "right",
    });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(MUTED_TEXT)
    .text(`Date d'émission : ${formatDate(invoice.issuedAt || invoice.createdAt)}`, 340, 84, {
      width: 215,
      align: "right",
    });

  // Ligne de séparation
  doc
    .moveTo(40, 105)
    .lineTo(555, 105)
    .lineWidth(1.5)
    .strokeColor(accentColor)
    .stroke();
};

const drawParties = (doc, invoice, businessProfile) => {
  const leftX = 40;
  const rightX = 315;
  const topY = 120;

  // Box Émetteur
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(MUTED_TEXT)
    .text("ÉMETTEUR (VENDEUR)", leftX, topY);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(TEXT_COLOR)
    .text(businessProfile?.businessName || "Mon Commerce", leftX, topY + 14);

  let yLeft = topY + 30;
  if (businessProfile?.phone) {
    doc.font("Helvetica").fontSize(8.5).fillColor(MUTED_TEXT).text(`Tél : ${businessProfile.phone}`, leftX, yLeft);
    yLeft += 12;
  }
  if (businessProfile?.address) {
    doc.font("Helvetica").fontSize(8.5).fillColor(MUTED_TEXT).text(businessProfile.address, leftX, yLeft);
    yLeft += 12;
  }
  const location = [businessProfile?.city, businessProfile?.country].filter(Boolean).join(", ");
  if (location && (!businessProfile?.address || !businessProfile.address.toLowerCase().includes(location.toLowerCase()))) {
    doc.font("Helvetica").fontSize(8.5).fillColor(MUTED_TEXT).text(location, leftX, yLeft);
    yLeft += 12;
  }

  // Box Destinataire
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(MUTED_TEXT)
    .text("DESTINATAIRE (CLIENT)", rightX, topY, { width: 240, align: "right" });

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(TEXT_COLOR)
    .text(invoice.customerName, rightX, topY + 14, { width: 240, align: "right" });

  let yRight = topY + 30;
  if (invoice.customerPhone) {
    doc.font("Helvetica").fontSize(8.5).fillColor(MUTED_TEXT).text(`Tél : ${invoice.customerPhone}`, rightX, yRight, { width: 240, align: "right" });
    yRight += 12;
  }
  if (invoice.customerEmail) {
    doc.font("Helvetica").fontSize(8.5).fillColor(MUTED_TEXT).text(invoice.customerEmail, rightX, yRight, { width: 240, align: "right" });
    yRight += 12;
  }
  if (invoice.customerAddress) {
    doc.font("Helvetica").fontSize(8.5).fillColor(MUTED_TEXT).text(invoice.customerAddress, rightX, yRight, { width: 240, align: "right" });
    yRight += 12;
  }
  const custLocation = [invoice.customerCity, invoice.customerCountry].filter(Boolean).join(", ");
  if (custLocation && (!invoice.customerAddress || !invoice.customerAddress.toLowerCase().includes(custLocation.toLowerCase()))) {
    doc.font("Helvetica").fontSize(8.5).fillColor(MUTED_TEXT).text(custLocation, rightX, yRight, { width: 240, align: "right" });
    yRight += 12;
  }

  return Math.max(yLeft, yRight) + 20;
};

const drawTableHeader = (doc, y, accentColor) => {
  doc
    .rect(40, y, 515, 20)
    .fillColor(accentColor)
    .fill();

  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text("Désignation / Description", 48, y + 6, { width: 210 })
    .text("Prix unitaire", 265, y + 6, { width: 80, align: "right" })
    .text("Unité", 355, y + 6, { width: 40, align: "center" })
    .text("Qté", 400, y + 6, { width: 35, align: "center" })
    .text("Montant", 445, y + 6, { width: 100, align: "right" });
};

const drawItemsTable = (doc, invoice, currency, accentColor, startY) => {
  let y = startY;

  drawTableHeader(doc, y, accentColor);
  y += 20;

  invoice.items.forEach((item, index) => {
    const hasDesc = !!item.description;
    const rowHeight = hasDesc ? 30 : 22;

    if (y + rowHeight > 660) {
      doc.addPage();
      y = 40;
      drawTableHeader(doc, y, accentColor);
      y += 20;
    }

    if (index % 2 === 0) {
      doc
        .rect(40, y, 515, rowHeight)
        .fillColor(LIGHT_GRAY)
        .fill();
    }

    doc
      .rect(40, y, 515, rowHeight)
      .strokeColor(BORDER_COLOR)
      .lineWidth(0.5)
      .stroke();

    doc
      .fillColor(TEXT_COLOR)
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .text(item.productName, 48, y + 6, { width: 210 });

    if (hasDesc) {
      doc
        .fontSize(7.5)
        .font("Helvetica")
        .fillColor(MUTED_TEXT)
        .text(item.description, 48, y + 17, { width: 210 });
    }

    doc
      .fillColor(TEXT_COLOR)
      .font("Helvetica")
      .fontSize(8.5)
      .text(formatAmount(item.unitPrice, currency), 265, y + 6, {
        width: 80,
        align: "right",
      })
      .text(item.unit || "-", 355, y + 6, {
        width: 40,
        align: "center",
      })
      .text(String(item.quantity), 400, y + 6, {
        width: 35,
        align: "center",
      })
      .font("Helvetica-Bold")
      .text(formatAmount(item.lineTotal, currency), 445, y + 6, {
        width: 100,
        align: "right",
      });

    y += rowHeight;
  });

  return y + 14;
};

const drawTotalsAndNotes = (doc, invoice, businessProfile, currency, y, accentColor, qrBuffer) => {
  let currentY = y;

  // Si l'espace restant est trop serré, passer à la page suivante
  if (currentY > 640) {
    doc.addPage();
    currentY = 40;
  }

  // --- BLOC GAUCHE : RÈGLEMENT, MOBILE MONEY & QR CODE ---
  const leftX = 40;
  const leftWidth = 275;

  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(TEXT_COLOR)
    .text("RÈGLEMENT & PAIEMENT :", leftX, currentY);

  // Cadre des modalités
  doc
    .rect(leftX, currentY + 12, leftWidth, 108)
    .fillColor("#FFFFFF")
    .fill()
    .strokeColor(BORDER_COLOR)
    .lineWidth(0.5)
    .stroke();

  // QR Code à gauche dans le cadre
  if (qrBuffer) {
    try {
      doc.image(qrBuffer, leftX + 6, currentY + 18, {
        fit: [65, 65],
      });
      doc
        .font("Helvetica")
        .fontSize(6.5)
        .fillColor(MUTED_TEXT)
        .text("Scanner pour payer", leftX + 6, currentY + 86, {
          width: 65,
          align: "center",
        });
    } catch (e) {
      console.error(e);
    }
  }

  // Informations Mobile Money à droite du QR code
  const infoX = qrBuffer ? leftX + 78 : leftX + 10;
  const infoW = leftWidth - (qrBuffer ? 86 : 20);
  let payY = currentY + 18;

  if (businessProfile?.waveNumber) {
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor("#0284C7")
      .text("• Wave : ", infoX, payY, { continued: true })
      .font("Helvetica")
      .fillColor(TEXT_COLOR)
      .text(businessProfile.waveNumber);
    payY += 13;
  }

  if (businessProfile?.orangeMoneyNumber) {
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor("#EA580C")
      .text("• Orange Money : ", infoX, payY, { continued: true })
      .font("Helvetica")
      .fillColor(TEXT_COLOR)
      .text(businessProfile.orangeMoneyNumber);
    payY += 13;
  }

  if (businessProfile?.momoNumber) {
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor("#CA8A04")
      .text("• MoMo : ", infoX, payY, { continued: true })
      .font("Helvetica")
      .fillColor(TEXT_COLOR)
      .text(businessProfile.momoNumber);
    payY += 13;
  }

  // Notes de la facture
  const customNotes = invoice.notes || businessProfile?.paymentInstructions || "Paiement à réception. Merci pour votre confiance.";
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(MUTED_TEXT)
    .text(customNotes, infoX, payY, {
      width: infoW,
      height: 38,
    });

  // --- BLOC DROIT : TOTAUX ---
  const rightX = 330;
  const rightWidth = 225;
  const labelX = rightX + 12;
  const valX = rightX + 100;
  const valW = rightWidth - 112;

  doc
    .rect(rightX, currentY + 12, rightWidth, 108)
    .fillColor("#FFFFFF")
    .fill()
    .strokeColor(BORDER_COLOR)
    .lineWidth(1)
    .stroke();

  // Sous-total
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(MUTED_TEXT)
    .text("Sous-total HT :", labelX, currentY + 24)
    .font("Helvetica-Bold")
    .fillColor(TEXT_COLOR)
    .text(formatAmount(invoice.subTotal, currency), valX, currentY + 24, {
      width: valW,
      align: "right",
    });

  // TVA / Taxes
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(MUTED_TEXT)
    .text("TVA / Taxes :", labelX, currentY + 46)
    .font("Helvetica-Bold")
    .fillColor(TEXT_COLOR)
    .text(formatAmount(invoice.taxTotal, currency), valX, currentY + 46, {
      width: valW,
      align: "right",
    });

  // Ligne de séparation interne totaux
  doc
    .moveTo(labelX, currentY + 66)
    .lineTo(rightX + rightWidth - 12, currentY + 66)
    .strokeColor(BORDER_COLOR)
    .stroke();

  // Fond bandeau Total TTC
  doc
    .rect(rightX + 1, currentY + 74, rightWidth - 2, 45)
    .fillColor(LIGHT_GRAY)
    .fill();

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(TEXT_COLOR)
    .text("TOTAL TTC :", labelX, currentY + 88)
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(accentColor)
    .text(formatAmount(invoice.total, currency), valX, currentY + 87, {
      width: valW,
      align: "right",
    });
};

const drawFooter = (doc, businessProfile) => {
  const footerY = 805;

  const companyInfo = [
    businessProfile?.businessName,
    businessProfile?.phone ? `Tél: ${businessProfile.phone}` : null,
    businessProfile?.address,
    businessProfile?.city,
    businessProfile?.country,
  ]
    .filter(Boolean)
    .join(" • ");

  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(MUTED_TEXT)
    .text(companyInfo || "Facture générée avec WariFact", 40, footerY, {
      width: 515,
      align: "center",
      lineBreak: false,
    });
};

const generateInvoicePdf = async ({ invoice, businessProfile }) => {
  const accentColor = await getAccentColorFromLogo(businessProfile?.logoUrl);
  const qrBuffer = await generatePaymentQrCode({ invoice, businessProfile });

  return new Promise((resolve, reject) => {
    try {
      const invoicesDir = path.join(__dirname, "../../uploads/invoices");

      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }

      const fileName = `${invoice.invoiceNumber}.pdf`;
      const filePath = path.join(invoicesDir, fileName);
      const pdfUrl = `/uploads/invoices/${fileName}`;

      const doc = new PDFDocument({
        size: "A4",
        margins: {
          top: 35,
          bottom: 25,
          left: 40,
          right: 40,
        },
        autoFirstPage: true,
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const currency = businessProfile?.currency || "FCFA";

      drawHeader(doc, invoice, businessProfile, accentColor);
      const partiesEndY = drawParties(doc, invoice, businessProfile);
      const tableEndY = drawItemsTable(doc, invoice, currency, accentColor, partiesEndY);

      drawTotalsAndNotes(doc, invoice, businessProfile, currency, tableEndY, accentColor, qrBuffer);
      drawFooter(doc, businessProfile);

      doc.end();

      stream.on("finish", () => {
        resolve({
          filePath,
          pdfUrl,
        });
      });

      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePdf,
};