const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { getAccentColorFromLogo } = require("./brandColor.service");

const ACCENT_COLOR = "#8CC63F";
const TEXT_COLOR = "#111111";
const LIGHT_GRAY = "#F4F4F4";
const BORDER_COLOR = "#D0D0D0";

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
  return new Date(date).toLocaleDateString("fr-FR");
};

const drawTextLine = (doc, label, value, x, y) => {
  if (!value) return y;

  doc
    .fillColor(TEXT_COLOR)
    .fontSize(9)
    .font("Helvetica-Bold")
    .text(`${label} :`, x, y, { continued: true })
    .font("Helvetica")
    .text(` ${value}`);

  return doc.y + 4;
};

const drawLogo = (doc, businessProfile, x, y) => {
  if (!businessProfile?.logoUrl) {
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(TEXT_COLOR)
      .text("LOGO", x, y);

    return;
  }

  const logoPath = path.join(
    __dirname,
    "../..",
    businessProfile.logoUrl.replace(/^\/+/, "")
  );

  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, x, y, {
      fit: [90, 60],
    });
  } else {
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(TEXT_COLOR)
      .text("LOGO", x, y);
  }
};

const drawHeader = (doc, invoice, businessProfile) => {
  const title = invoice.type === "QUOTE" ? "DEVIS" : "FACTURE";
  const numberLabel = invoice.type === "QUOTE" ? "DEVIS N°" : "FACTURE N°";

  drawLogo(doc, businessProfile, 50, 45);

  doc
    .font("Helvetica-Bold")
    .fontSize(34)
    .fillColor(TEXT_COLOR)
    .text(title, 330, 45, {
      width: 215,
      align: "right",
    });

  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .text(`${numberLabel} : ${invoice.invoiceNumber}`, 330, 95, {
      width: 215,
      align: "right",
    });

  doc
    .font("Helvetica")
    .fontSize(9)
    .text(`Date : ${formatDate(invoice.issuedAt)}`, 330, 115, {
      width: 215,
      align: "right",
    });

  doc
    .moveTo(50, 145)
    .lineTo(545, 145)
    .lineWidth(1)
    .strokeColor(TEXT_COLOR)
    .stroke();
};

const drawParties = (doc, invoice, businessProfile) => {
  const leftX = 50;
  const rightX = 315;
  const topY = 170;

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(TEXT_COLOR)
    .text("ÉMETTEUR", leftX, topY);

  let yLeft = topY + 22;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(businessProfile?.businessName || "Mon commerce", leftX, yLeft);

  yLeft += 18;

  yLeft = drawTextLine(doc, "Téléphone", businessProfile?.phone, leftX, yLeft);
  yLeft = drawTextLine(doc, "Adresse", businessProfile?.address, leftX, yLeft);
  yLeft = drawTextLine(doc, "Ville", businessProfile?.city, leftX, yLeft);
  yLeft = drawTextLine(doc, "Pays", businessProfile?.country, leftX, yLeft);

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(TEXT_COLOR)
    .text("DESTINATAIRE", rightX, topY, {
      width: 230,
      align: "right",
    });

  let yRight = topY + 22;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(invoice.customerName, rightX, yRight, {
      width: 230,
      align: "right",
    });

  yRight += 18;

  const customerLines = [
    ["Téléphone", invoice.customerPhone],
    ["Email", invoice.customerEmail],
    ["Adresse", invoice.customerAddress],
    ["Ville", invoice.customerCity],
    ["Pays", invoice.customerCountry],
  ];

  customerLines.forEach(([label, value]) => {
    if (value) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(TEXT_COLOR)
        .text(`${label} : ${value}`, rightX, yRight, {
          width: 230,
          align: "right",
        });

      yRight += 14;
    }
  });
};

const drawTableHeader = (doc, y, accentColor) => {
  doc
    .rect(50, y, 495, 24)
    .fillColor(accentColor)
    .fill();

  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("Description", 58, y + 8, { width: 190 })
    .text("Prix unitaire", 250, y + 8, { width: 80, align: "right" })
    .text("Unité", 340, y + 8, { width: 45, align: "center" })
    .text("Qté", 395, y + 8, { width: 40, align: "center" })
    .text("Montant", 445, y + 8, { width: 90, align: "right" });
};

const drawItemsTable = (doc, invoice, currency, accentColor) => {
  let y = 310;

  drawTableHeader(doc, y, accentColor);
  y += 24;

  invoice.items.forEach((item, index) => {
    const rowHeight = 34;

    if (y + rowHeight > 700) {
      doc.addPage();
      y = 60;
      drawTableHeader(doc, y, accentColor);
      y += 24;
    }

    if (index % 2 === 0) {
      doc
        .rect(50, y, 495, rowHeight)
        .fillColor(LIGHT_GRAY)
        .fill();
    }

    doc
      .rect(50, y, 495, rowHeight)
      .strokeColor(BORDER_COLOR)
      .lineWidth(0.5)
      .stroke();

    doc
      .fillColor(TEXT_COLOR)
      .font("Helvetica")
      .fontSize(9)
      .text(item.productName, 58, y + 8, { width: 180 });

    if (item.description) {
      doc
        .fontSize(8)
        .fillColor("#555555")
        .text(item.description, 58, y + 20, { width: 180 });
    }

    doc
      .fillColor(TEXT_COLOR)
      .fontSize(9)
      .text(formatAmount(item.unitPrice, currency), 250, y + 10, {
        width: 80,
        align: "right",
      })
      .text(item.unit || "-", 340, y + 10, {
        width: 45,
        align: "center",
      })
      .text(String(item.quantity), 395, y + 10, {
        width: 40,
        align: "center",
      })
      .font("Helvetica-Bold")
      .text(formatAmount(item.lineTotal, currency), 445, y + 10, {
        width: 90,
        align: "right",
      })
      .font("Helvetica");

    y += rowHeight;
  });

  return y + 25;
};

const drawTotals = (doc, invoice, currency, y) => {
  const boxX = 335;
  const labelX = 350;
  const valueX = 445;

  doc
    .rect(boxX, y, 210, 90)
    .fillColor("#FFFFFF")
    .fill()
    .strokeColor(BORDER_COLOR)
    .stroke();

  doc
    .fillColor(TEXT_COLOR)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("Sous-total", labelX, y + 15)
    .font("Helvetica")
    .text(formatAmount(invoice.subTotal, currency), valueX, y + 15, {
      width: 85,
      align: "right",
    });

  doc
    .font("Helvetica-Bold")
    .text("Taxe", labelX, y + 38)
    .font("Helvetica")
    .text(formatAmount(invoice.taxTotal, currency), valueX, y + 38, {
      width: 85,
      align: "right",
    });

  doc
    .moveTo(labelX, y + 60)
    .lineTo(530, y + 60)
    .strokeColor(BORDER_COLOR)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(TEXT_COLOR)
    .text("TOTAL TTC", labelX, y + 68)
    .text(formatAmount(invoice.total, currency), valueX, y + 68, {
      width: 85,
      align: "right",
    });
};

const drawNotesAndSignature = (doc, invoice, y) => {
  const notesX = 50;
  const signatureX = 365;

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(TEXT_COLOR)
    .text("RÈGLEMENT / NOTES", notesX, y);

  doc
    .rect(notesX, y + 20, 230, 85)
    .strokeColor(BORDER_COLOR)
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(TEXT_COLOR)
    .text(
      invoice.notes || "Merci pour votre confiance.",
      notesX + 10,
      y + 32,
      {
        width: 210,
        height: 60,
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("Signature", signatureX, y + 5, {
      width: 160,
      align: "right",
    });

  doc
    .rect(signatureX, y + 28, 180, 77)
    .strokeColor(BORDER_COLOR)
    .stroke();
};

const drawFooter = (doc, businessProfile) => {
  const footerY = 790;

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#666666")
    .text(
      businessProfile?.businessName || "Mon commerce",
      50,
      footerY,
      {
        width: 495,
        align: "center",
      }
    );
};

const generateInvoicePdf = async ({ invoice, businessProfile }) => {
  const accentColor = await getAccentColorFromLogo(businessProfile?.logoUrl);

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
        margin: 50,
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const currency = businessProfile?.currency || "FCFA";

      drawHeader(doc, invoice, businessProfile);
      drawParties(doc, invoice, businessProfile);

      const tableEndY = drawItemsTable(doc, invoice, currency, accentColor);

      let bottomY = tableEndY;

      if (bottomY > 610) {
        doc.addPage();
        bottomY = 80;
      }

      drawTotals(doc, invoice, currency, bottomY);
      drawNotesAndSignature(doc, invoice, bottomY + 120);
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