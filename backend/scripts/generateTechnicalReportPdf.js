const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const OUTPUT_PATH = path.join(__dirname, "../../RAPPORT_TECHNIQUE_WARIFACT.pdf");

const PRIMARY_COLOR = "#6B1D27"; // Bordeaux BCEAO
const GOLD_COLOR = "#C58B2B";    // Or Baoulé
const DARK_TEXT = "#1C1215";
const MUTED_TEXT = "#594B51";
const LIGHT_BG = "#FAF7F2";
const BORDER_COLOR = "#E8DFD5";
const GREEN_COLOR = "#15803D";

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 40, bottom: 40, left: 45, right: 45 },
  bufferPages: true,
  autoFirstPage: true,
});

const stream = fs.createWriteStream(OUTPUT_PATH);
doc.pipe(stream);

// Helper: Titre de section
function drawSectionHeader(title, iconText = "■") {
  if (doc.y > 680) doc.addPage();
  
  doc.moveDown(0.8);
  const startY = doc.y;

  doc
    .rect(45, startY, 505, 24)
    .fillColor(LIGHT_BG)
    .fill()
    .strokeColor(BORDER_COLOR)
    .lineWidth(0.8)
    .stroke();

  doc
    .rect(45, startY, 4, 24)
    .fillColor(PRIMARY_COLOR)
    .fill();

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(PRIMARY_COLOR)
    .text(`${iconText}  ${title.toUpperCase()}`, 56, startY + 6);

  doc.y = startY + 30;
}

// Helper: Sous-titre
function drawSubSection(title) {
  if (doc.y > 700) doc.addPage();
  doc.moveDown(0.4);
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(GOLD_COLOR)
    .text(title);
  doc.moveDown(0.2);
}

// Helper: Paragraphe
function drawParagraph(text) {
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(DARK_TEXT)
    .text(text, { align: "justify", lineGap: 2.5 });
  doc.moveDown(0.3);
}

// Helper: Puce
function drawBullet(title, description) {
  if (doc.y > 720) doc.addPage();
  
  const y = doc.y;
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(PRIMARY_COLOR)
    .text("• ", 55, y, { continued: true })
    .text(`${title} : `, { continued: true })
    .font("Helvetica")
    .fillColor(DARK_TEXT)
    .text(description, { lineGap: 2 });
  
  doc.moveDown(0.2);
}

// Helper: Tableau récapitulatif
function drawTable(headers, rows, columnWidths) {
  if (doc.y > 650) doc.addPage();

  let startY = doc.y + 4;
  const startX = 45;

  // Header row
  doc
    .rect(startX, startY, 505, 18)
    .fillColor(PRIMARY_COLOR)
    .fill();

  let curX = startX + 6;
  headers.forEach((h, i) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor("#FFFFFF")
      .text(h, curX, startY + 4, { width: columnWidths[i] - 10, align: "left" });
    curX += columnWidths[i];
  });

  startY += 18;

  // Data rows
  rows.forEach((row, rowIndex) => {
    const rowHeight = 18;
    if (startY + rowHeight > 750) {
      doc.addPage();
      startY = 50;
    }

    if (rowIndex % 2 === 0) {
      doc
        .rect(startX, startY, 505, rowHeight)
        .fillColor(LIGHT_BG)
        .fill();
    }

    doc
      .rect(startX, startY, 505, rowHeight)
      .strokeColor(BORDER_COLOR)
      .lineWidth(0.5)
      .stroke();

    let cellX = startX + 6;
    row.forEach((cell, cellIdx) => {
      doc
        .font(cellIdx === 0 ? "Helvetica-Bold" : "Helvetica")
        .fontSize(7.5)
        .fillColor(DARK_TEXT)
        .text(cell, cellX, startY + 4, { width: columnWidths[cellIdx] - 10, align: "left" });
      cellX += columnWidths[cellIdx];
    });

    startY += rowHeight;
  });

  doc.y = startY + 8;
}

// ==================== EN-TÊTE DE PREMIÈRE PAGE ====================
doc
  .rect(45, 40, 505, 75)
  .fillColor(LIGHT_BG)
  .fill()
  .strokeColor(BORDER_COLOR)
  .lineWidth(1)
  .stroke();

// Bandeau décoratif bordeaux en haut
doc
  .rect(45, 40, 505, 5)
  .fillColor(PRIMARY_COLOR)
  .fill();

doc
  .font("Helvetica-Bold")
  .fontSize(18)
  .fillColor(PRIMARY_COLOR)
  .text("WARIFACT", 60, 56)
  .fontSize(10)
  .fillColor(GOLD_COLOR)
  .text("RAPPORT TECHNIQUE DES MODIFICATIONS & ÉVOLUTIONS", 60, 78);

doc
  .font("Helvetica")
  .fontSize(8)
  .fillColor(MUTED_TEXT)
  .text(`Date du rapport : ${new Date().toLocaleDateString("fr-FR")}`, 360, 60, { align: "right", width: 175 })
  .text("Version : 2.5 (Production Ready)", 360, 74, { align: "right", width: 175 })
  .text("Auteur : Antigravity & Équipe WariFact", 360, 88, { align: "right", width: 175 });

doc.y = 125;

// ==================== SECTION 1 : VUE D'ENSEMBLE ====================
drawSectionHeader("1. Vue d'Ensemble du Projet & Rebranding", "🏛️");

drawParagraph(
  "L'application a fait l'objet d'une refonte complète de son identité visuelle, de son ergonomie et de sa stack technique pour devenir WariFact, une plateforme de facturation et de gestion commerciale haut de gamme adaptée aux réalités économiques et bancaires d'Afrique de l'Ouest (Zone UEMOA / Franc CFA)."
);

drawBullet("Identité WariFact", "Adoption du nom 'WariFact' (Wari = argent/monnaie en Mandé/Bambara + Facturation) et intégration de l'emblème officiel de la BCEAO (Poisson-scie Baoulé / poids monétaire akan).");
drawBullet("Charte Visuelle Royale", "Palette raffinée articulée autour du Bordeaux noble (#6B1D27), de l'Or Impérial (#C58B2B) et d'un fond Ivoire perlé (#FAF7F2), apportant un standing institutionnel et financier.");

// ==================== SECTION 2 : ARCHITECTURE & SÉCURITÉ BACKEND ====================
drawSectionHeader("2. Architecture Backend & Sécurisation", "🔒");

drawParagraph(
  "Le backend Node.js / Express / Prisma a été profondément consolidé afin de garantir la robustesse des API, la conformité de la base de données et la protection contre les cyberattaques."
);

drawBullet("Protection Brute-Force", "Mise en place de rate-limiters stricts (express-rate-limit) sur les endpoints sensibles d'authentification (/api/auth/login, /api/auth/register).");
drawBullet("En-têtes Sécurisés", "Intégration de Helmet pour injecter automatiquement les en-têtes HTTP de sécurité (protection XSS, Clickjacking, MIME sniffing).");
drawBullet("Middleware d'Erreurs Global", "Gestionnaire d'erreurs centralisé (errorMiddleware) interceptant les exceptions non gérées et normalisant les réponses d'erreur.");
drawBullet("Gestion Propre du Stockage", "Suppression automatique des anciens fichiers logos sur le disque lors du téléversement d'un nouveau logo pour éviter l'encombrement du serveur.");
drawBullet("Évolution du Schéma Prisma", "Extension du modèle BusinessProfile avec les champs waveNumber, orangeMoneyNumber, momoNumber, et paymentInstructions, accompagnée d'une migration SQL reproductible.");

// ==================== SECTION 3 : GÉNÉRATION PDF 1 PAGE & QR CODE ====================
drawSectionHeader("3. Moteur PDF 1 Page A4 & QR Code Mobile Money", "📄");

drawParagraph(
  "Le moteur de génération de documents PDF (factures et devis) basé sur PDFKit a été entièrement reprogrammé pour garantir une mise en page chirurgicale sur une seule page A4 et intégrer le paiement instantané."
);

drawBullet("Format 1 Page A4 Garanti", "Recalcul strict des coordonnées (dimensions 595.28 x 841.89 pt, marges 40/25 pt), gestion compacte des lignes d'articles et bas de page sans débordement.");
drawBullet("Thématisation Dynamique", "Extraction automatique de la couleur dominante du logo de l'entreprise via node-vibrant pour habiller élégamment les titres, bordures et tableaux du PDF.");
drawBullet("QR Code Dynamique de Paiement", "Génération à la volée d'un QR Code haute résolution (qrcode) encodant le montant, le numéro de facture et les coordonnées Wave / Orange Money du vendeur.");
drawBullet("Déduplication des Adresses", "Algorithme intelligent évitant la répétition de la ville ou du pays si déjà inclus dans l'adresse physique.");

// ==================== SECTION 4 : FONCTIONNALITÉS MÉTIER ====================
drawSectionHeader("4. Fonctionnalités Métier & Flux Utilisateur", "💼");

drawBullet("Impression Directe en 1 Clic", "Bouton d'impression directe dans le tableau de bord, la liste des factures et l'écran de confirmation, utilisant une iframe invisible pour ouvrir instantanément la boîte de dialogue d'impression.");
drawBullet("Partage WhatsApp Automatique Enrichi", "Génération d'un message prérempli complet incluant le lien PDF et les coordonnées Mobile Money Wave et Orange Money.");
drawBullet("Gestion Clients & Produits", "Interfaces complètes de création, modification et recherche avec calcul dynamique des totaux et de la TVA.");
drawBullet("Conversion Devis en Facture", "Transformation instantanée d'un devis accepté en facture officielle en 1 clic sans ressaisie.");

// ==================== SECTION 5 : TRANSFORMATION PWA ====================
drawSectionHeader("5. Transformation en Progressive Web App (PWA)", "📱");

drawParagraph(
  "WariFact est désormais une véritable Progressive Web App (PWA) installable sur smartphone (Android / iOS) et ordinateur sans passer par les stores d'applications."
);

drawBullet("Manifeste Web (/manifest.webmanifest)", "Configuration complète de l'application (nom, orientation portrait, mode standalone, icônes 192x192 et 512x512, thème #6B1D27).");
drawBullet("Service Worker (/sw.js & pwa.js)", "Stratégie de cache des fichiers statiques pour un chargement instantané sans latence.");
drawBullet("Composant PwaInstallPrompt", "Bannière intelligente qui détecte l'appareil et propose un bouton 'Installer WariFact' sur l'écran d'accueil.");
drawBullet("Support Apple iOS", "Balises meta spécifiques (apple-mobile-web-app-capable, apple-touch-icon) pour une intégration fluide sur iPhone.");

// ==================== SECTION 6 : TABLEAU DES FICHIERS MODIFIÉS ====================
drawSectionHeader("6. Récapitulatif Fichier par Fichier", "📂");

const tableHeaders = ["Composant / Fichier", "Nature des modifications", "Impact technique"];
const tableRows = [
  ["backend/prisma/schema.prisma", "Ajout champs Wave, OM, MoMo", "Persistance des coordonnées Mobile Money"],
  ["backend/src/services/invoicePdf.service.js", "Refonte A4 1 page + QR Code", "PDF 1 page avec paiement scannable"],
  ["backend/src/controllers/businessProfile.js", "Prise en compte Mobile Money", "API CRUD profil enrichie"],
  ["backend/src/middlewares/*", "RateLimiter + ErrorMiddleware", "Sécurité contre attaques & gestion erreurs"],
  ["frontend/public/manifest.webmanifest", "Création manifeste PWA", "Application installable sur mobile"],
  ["frontend/public/sw.js", "Service Worker de cache", "Chargement instantané hors connexion"],
  ["frontend/src/components/BrandLogo.jsx", "Composant logo & emblème BCEAO", "Identité visuelle cohérente"],
  ["frontend/src/components/PwaInstallPrompt.jsx", "Bannière d'installation mobile", "Invitation fluide à l'installation"],
  ["frontend/src/index.css", "Design tokens Bordeaux & Or", "Harmonisation globale des styles"],
  ["frontend/src/pages/InvoicesPage.jsx", "Impression + WhatsApp enrichi", "Partage & encaissement accélérés"],
  ["frontend/src/pages/BusinessProfilePage.jsx", "Carte Mobile Money + Live PDF", "Gestion complète des coordonnées"],
];

drawTable(tableHeaders, tableRows, [160, 175, 170]);

// ==================== PIED DE PAGE NUMÉROTÉ ====================
const pageRange = doc.bufferedPageRange();
for (let i = 0; i < pageRange.count; i++) {
  doc.switchToPage(i);

  // Ligne de pied de page
  doc
    .moveTo(45, 800)
    .lineTo(550, 800)
    .lineWidth(0.5)
    .strokeColor(BORDER_COLOR)
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(MUTED_TEXT)
    .text("WariFact • Rapport Technique d'Évolution et d'Architecture", 45, 808, { width: 300, align: "left" })
    .text(`Page ${i + 1} sur ${pageRange.count}`, 350, 808, { width: 200, align: "right" });
}

doc.end();

stream.on("finish", () => {
  console.log(`Rapport technique généré avec succès : ${OUTPUT_PATH}`);
});
