const fs = require('fs');
const path = require('path');
const PDFDocument = require('../backend/node_modules/pdfkit');

const outputPath = path.join(__dirname, 'SLIDES_MAKE_ET_N8N_IA.pdf');
const doc = new PDFDocument({
  size: 'A4',
  layout: 'landscape',
  margins: { top: 25, bottom: 20, left: 40, right: 40 },
  bufferPages: true,
  autoFirstPage: false
});

const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Dimensions A4 Paysage
const PAGE_W = 841.89;
const PAGE_H = 595.28;
const CW = PAGE_W - 80; // 761.89 pt

// Palette de couleurs professionnelles
const C = {
  primary: '#3730A3',      // Indigo
  primaryLight: '#EEF2FF',
  makePurple: '#6D28D9',   // Violet Make
  n8nOrange: '#EA580C',    // Orange n8n
  slate900: '#0F172A',
  slate800: '#1E293B',
  slate700: '#334155',
  slate600: '#475569',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  green: '#059669',
  greenBg: '#ECFDF5',
  amber: '#D97706',
  amberBg: '#FFFBEB',
  blueBg: '#EFF6FF',
  red: '#DC2626',
  redBg: '#FEF2F2',
  cyan: '#38BDF8',
  white: '#FFFFFF'
};

// Helper: En-tête de slide
function startSlide(title, badgeText = 'Module 3 : Make & n8n', timeText = '', badgeColor = C.primary) {
  doc.addPage();
  const y = 28;

  // Badge catégorie
  doc.roundedRect(40, y, 175, 16, 3).fill(badgeColor);
  doc.fillColor(C.white).font('Helvetica-Bold').fontSize(7.5).text(badgeText.toUpperCase(), 40, y + 4.5, { width: 175, align: 'center' });

  // Timer si présent
  if (timeText) {
    doc.roundedRect(223, y, 95, 16, 3).fill(C.slate100);
    doc.fillColor(C.slate700).font('Helvetica-Bold').fontSize(7.5).text(timeText, 223, y + 4.5, { width: 95, align: 'center' });
  }

  // Titre
  const titleY = y + 21;
  doc.fillColor(C.slate900).font('Helvetica-Bold').fontSize(16).text(title, 40, titleY, { width: CW });
  
  // Ligne de séparation
  const lineY = doc.y + 4;
  doc.strokeColor(C.slate200).lineWidth(1).moveTo(40, lineY).lineTo(40 + CW, lineY).stroke();
  doc.y = lineY + 12;
}

// Helper: Carte de contenu
function drawCard(x, y, w, h, title, desc, borderColor = C.slate200, bgColor = C.slate50) {
  doc.roundedRect(x, y, w, h, 6).fill(bgColor);
  doc.strokeColor(borderColor).lineWidth(1).roundedRect(x, y, w, h, 6).stroke();

  let curY = y + 9;
  if (title) {
    doc.fillColor(C.slate900).font('Helvetica-Bold').fontSize(9.5).text(title, x + 12, curY, { width: w - 24 });
    curY = doc.y + 4;
  }
  if (desc) {
    doc.fillColor(C.slate700).font('Helvetica').fontSize(8).text(desc, x + 12, curY, { width: w - 24, lineGap: 1.8 });
  }
}

// Helper: Boîte de code
function drawCode(x, y, w, h, code, title = '') {
  doc.roundedRect(x, y, w, h, 6).fill(C.slate800);
  let curY = y + 8;
  if (title) {
    doc.fillColor('#94A3B8').font('Helvetica-Bold').fontSize(7.5).text(title.toUpperCase(), x + 12, curY);
    curY += 11;
  }
  doc.fillColor(C.white).font('Courier').fontSize(7.5).text(code, x + 12, curY, { width: w - 24, lineGap: 1.4 });
}

// Helper: Boîte de schéma
function drawDiagram(x, y, w, h, text) {
  doc.roundedRect(x, y, w, h, 6).fill('#0B0F19');
  doc.strokeColor('#1E293B').lineWidth(1).roundedRect(x, y, w, h, 6).stroke();
  doc.fillColor(C.cyan).font('Courier').fontSize(8).text(text, x + 14, y + 10, { width: w - 28, lineGap: 1.8 });
}

// Helper: Checkpoint
function drawBanner(x, y, w, h, title, text, type = 'info') {
  let bg = C.blueBg;
  let border = C.primary;
  if (type === 'success') { bg = C.greenBg; border = C.green; }
  if (type === 'warning') { bg = C.amberBg; border = C.amber; }

  doc.roundedRect(x, y, w, h, 6).fill(bg);
  doc.rect(x, y, 4, h).fill(border);

  doc.fillColor(border).font('Helvetica-Bold').fontSize(8.5).text(title, x + 14, y + 7);
  doc.fillColor(C.slate700).font('Helvetica').fontSize(8).text(text, x + 14, y + 20, { width: w - 28, lineGap: 1.5 });
}

// Helper: Table
function drawTable(x, y, headers, rows, colWidths) {
  let curY = y;
  doc.rect(x, curY, CW, 19).fill(C.slate100);
  let curX = x;
  headers.forEach((h, i) => {
    doc.fillColor(C.slate900).font('Helvetica-Bold').fontSize(8).text(h, curX + 8, curY + 5.5, { width: colWidths[i] - 16 });
    curX += colWidths[i];
  });
  curY += 19;
  doc.strokeColor(C.slate200).lineWidth(0.8).moveTo(x, curY).lineTo(x + CW, curY).stroke();

  rows.forEach((row, rIdx) => {
    const isOdd = rIdx % 2 === 1;
    let maxH = 20;
    doc.font('Helvetica').fontSize(7.5);
    row.forEach((cell, cIdx) => {
      const h = doc.heightOfString(cell, { width: colWidths[cIdx] - 16 }) + 9;
      if (h > maxH) maxH = h;
    });

    if (isOdd) doc.rect(x, curY, CW, maxH).fill(C.slate50);

    let cellX = x;
    row.forEach((cell, cIdx) => {
      doc.fillColor(C.slate700).font(cIdx === 0 ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5).text(cell, cellX + 8, curY + 4.5, { width: colWidths[cIdx] - 16, lineGap: 1.3 });
      cellX += colWidths[cIdx];
    });
    curY += maxH;
    doc.strokeColor(C.slate200).lineWidth(0.5).moveTo(x, curY).lineTo(x + CW, curY).stroke();
  });
}

// ========================================================
// SLIDE 1 : COUVERTURE & PROGRESSION DU CYCLE
// ========================================================
doc.addPage();
// Grand bandeau
doc.roundedRect(40, 30, CW, 135, 8).fill(C.primary);
doc.roundedRect(55, 42, 230, 16, 8).fill('#312E81');
doc.fillColor('#E0E7FF').font('Helvetica-Bold').fontSize(7.5).text('CYCLE IA GÉNÉRATIVE • MODULE 3 / 3', 55, 46, { width: 230, align: 'center' });

doc.fillColor(C.white).font('Helvetica-Bold').fontSize(22).text('Automatisation & Orchestration avec l\'IA', 55, 68, { width: CW - 30 });
doc.fillColor('#CBD5E1').font('Helvetica').fontSize(11).text('Maîtriser Make & n8n pour passer du prompt conversationnel à des flux autonomes connectés', 55, 100, { width: CW - 30 });
doc.fillColor('#A5B4FC').font('Helvetica-Bold').fontSize(8.5).text('Séance pratique de 2 heures (120 minutes) • Public : Étudiants', 55, 130, { width: CW - 30 });

// 3 Cartes du cycle
const cW3 = (CW - 30) / 3;
const s1Y = 180;
drawCard(40, s1Y, cW3, 160, 'Module 1 : Les Fondations', 'ChatGPT, Gemini & Perplexity\n\n• Recherche augmentée et dialogue unitaire.\n• L\'humain formule manuellement chaque invite.\n• Analyse et synthèse de données textuelles.', C.slate200, C.white);
drawCard(40 + cW3 + 15, s1Y, cW3, 160, 'Module 2 : Création Visuelle', 'Lovable & Gamma\n\n• Génération rapide d\'applications web et de présentations percutantes.\n• L\'IA produit des artefacts finaux interactifs prêts à l\'emploi.', C.slate200, C.white);
drawCard(40 + (cW3 + 15) * 2, s1Y, cW3, 160, 'Module 3 : Cette Séance', 'Make & n8n (Orchestration)\n\n• L\'IA travaille en arrière-plan de façon autonome.\n• Déclenchée par des événements (emails, formulaires).\n• Connectée aux outils du quotidien.', C.n8nOrange, '#FFF7ED');

drawBanner(40, 360, CW, 65, 'OBJECTIF CENTRAL DU JOUR', 'Sortir de la posture d\'utilisateur ponctuel d\'un chatbot pour devenir l\'architecte d\'un écosystème où l\'IA résout des problèmes métiers réels sans intervention humaine permanente.', 'success');

// ========================================================
// SLIDE 2 : DÉROULÉ PÉDAGOGIQUE MINUTÉ (120 MIN)
// ========================================================
startSlide('Déroulé Pédagogique Minuté (120 Minutes)', 'Programme', '70% Pratique');

const sched = [
  ['00h00 - 00h15 (15 min)', '1. Cadrage & Concepts Fondamentaux', 'Comprendre le rôle d\'un orchestrateur, les Triggers, le JSON et le match Make vs n8n', 'Théorie & Démo'],
  ['00h15 - 00h55 (40 min)', '2. TP 1 Guidé sur Make (Pratique)', 'Bâtir un flux séquentiel : Veille & Synthèse IA avec extraction JSON et routeur conditionnel', 'TP individuel'],
  ['00h55 - 01h05 (10 min)', '3. Pause Active & Débriefing Collectif', 'Analyse des limites de Make, pièges des opérations et transition vers l\'approche Agent', 'Échange libre'],
  ['01h05 - 01h45 (40 min)', '4. TP 2 Guidé sur n8n (Pratique)', 'Bâtir un Agent IA autonome doté d\'une mémoire buffer et d\'un outil Calculator formel', 'TP individuel'],
  ['01h45 - 02h00 (15 min)', '5. Synthèse, Règles de Prod & Évaluation', 'Règles de sécurité, gestion des tokens et validation immédiate par quiz de 5 QCM', 'Quiz & Défi']
];

drawTable(40, doc.y, ['Timing', 'Séquence du Cours', 'Objectif Pédagogique Clé', 'Format'], sched, [120, 190, 330, 121.89]);

drawBanner(40, 345, CW, 60, 'MÉTHODOLOGIE D\'APPRENTISSAGE', 'Chaque séquence pratique est précédée d\'une démonstration enseignant de 3 minutes, suivie d\'une phase de réalisation pas-à-pas sur poste par les étudiants avec points de contrôle visuels.', 'info');

// ========================================================
// SLIDE 3 : DU CHATBOT À L'ORCHESTRATEUR
// ========================================================
startSlide('Changement de Paradigme : Du Chatbot au Système Autonome', 'Concepts Clés', '00h05');

const wHalf = (CW - 20) / 2;
const s3Y = doc.y;
drawCard(40, s3Y, wHalf, 205, '[-] Le Goulot d\'Étranglement Humain (Sans Automatisation)', 
  'Scénario traditionnel :\n\n' +
  '1. Un prospect remplit une demande sur un formulaire de contact.\n' +
  '2. Un commercial reçoit un email, l\'ouvre, et copie le message.\n' +
  '3. Il ouvre ChatGPT, formule un prompt et attend la réponse.\n' +
  '4. Il recopie la synthèse manuellement dans le CRM (HubSpot/Notion).\n' +
  '5. Il rédige un accusé de réception personnalisé par email.\n\n' +
  'Constat : Processus lent, indisponible la nuit, sujet aux oublis et erreurs.', 
  C.red, C.redBg);

drawCard(40 + wHalf + 20, s3Y, wHalf, 205, '[+] Le Flux d\'Orchestration d\'API (Avec Make / n8n)', 
  'Scénario automatisé :\n\n' +
  '1. La soumission émet un Webhook instantané vers l\'orchestrateur.\n' +
  '2. L\'orchestrateur injecte le message dans un LLM avec consigne stricte.\n' +
  '3. L\'IA qualifie le lead, note l\'urgence (1-10) et résume en 1,2 seconde.\n' +
  '4. L\'orchestrateur crée la fiche CRM et alerte l\'équipe sur Slack.\n' +
  '5. Un email personnalisé est envoyé immédiatement au client.\n\n' +
  'Constat : Traitement 24h/24 en temps réel, zéro tâche manuelle répétitive.', 
  C.green, C.greenBg);

drawDiagram(40, s3Y + 218, CW, 80, 
`Événement Réel (Formulaire / Email) ---> [ORCHESTRATEUR] ---> [MODÈLE IA (LLM)]
                                                |                     | (Analyse & Note)
                                                v                     v
                                         [CRM / NOTION] <--- [ALERTE SLACK / SMS]`);

// ========================================================
// SLIDE 4 : LES 4 BRIQUES D'UN WORKFLOW INTELLIGENT
// ========================================================
startSlide('Les 4 Piliers Fondamentaux d\'un Workflow Intelligent', 'Concepts Clés', '00h10');

const cW4 = (CW - 36) / 4;
const s4Y = doc.y;
drawCard(40, s4Y, cW4, 150, '1. Le Trigger', 'L\'événement déclencheur.\n\n• Polling : vérification cyclique (ex: toutes les 15 min).\n• Webhook : signal poussé instantanément dès que l\'événement a lieu.');
drawCard(40 + (cW4 + 12), s4Y, cW4, 150, '2. Données JSON', 'La langue universelle des API.\n\nStructure clé / valeur pour transporter des informations typées (nom, email, date, score) sans aucune perte.');
drawCard(40 + (cW4 + 12) * 2, s4Y, cW4, 150, '3. Module LLM', 'Le cerveau analytique.\n\nReçoit un Prompt Système strict + des variables dynamiques issues du trigger, et produit une décision exploitable.');
drawCard(40 + (cW4 + 12) * 3, s4Y, cW4, 150, '4. Routeur & Action', 'La prise de décision.\n\nAiguille le flux selon la note IA : si score >= 7 -> alerte urgente ; sinon -> archivage silencieux.');

drawCode(40, s4Y + 162, CW, 140, 
`// Exemple de charge utile (Payload JSON) échangée entre deux modules :
{
  "expediteur": "Cabinet Durand & Associés",
  "email": "contact@durand-audit.fr",
  "message_client": "Besoin urgent d'une démonstration pour 50 collaborateurs.",
  "score_ia": 9,
  "action_suggeree": "Assigner immédiatement à un account executive senior"
}`, 'Structure JSON échangée dans le workflow');

// ========================================================
// SLIDE 5 : MAKE VS N8N (MATRICE DE DÉCISION)
// ========================================================
startSlide('Make vs n8n : Quel Outil Choisir et Quand ?', 'Comparatif', '00h15');

const matchRows = [
  ['Philosophie & Ergonomie', '100% No-code visuel, interface par bulles très intuitive.', 'Fair-code, hybride No-code / Code (JavaScript & Python).'],
  ['Public Cible', 'Équipes marketing, commerciales, RH et chefs de projet.', 'Développeurs, ingénieurs data, architectes techniques.'],
  ['Mode d\'Hébergement', 'SaaS exclusivement hébergé sur les serveurs Make.', 'Cloud managé OU Auto-hébergement complet (Docker / VPS).'],
  ['Souveraineté (RGPD)', 'Les données transitent par l\'infrastructure Cloud Make.', 'Conformité absolue : déploiement étanche en réseau local.'],
  ['Capacités IA', 'Appels séquentiels classiques aux API (OpenAI, Gemini).', 'Nœud natif "AI Agent" (Framework LangChain, Tools autonomes).'],
  ['Facturation', 'Facturé au nombre d\'opérations (chaque bulle = 1 op).', 'Facturé aux exécutions (Cloud) ou 100% gratuit (Self-host).']
];
drawTable(40, doc.y, ['Critère Clé', 'Make (ex-Integromat)', 'n8n'], matchRows, [140, 310, 311.89]);

drawBanner(40, 345, CW, 65, 'RÈGLE D\'ARBITRAGE EN ENTREPRISE', 'Privilégiez Make pour des automatisations opérationnelles rapides avec des équipes non-techniques. Privilégiez n8n lorsque vous devez bâtir des agents IA autonomes capables d\'utiliser des outils, ou lorsque la confidentialité des données est non négociable.', 'warning');

// ========================================================
// SLIDE 6 : TP 1 PRÉSENTATION DU CAS D'USAGE MAKE
// ========================================================
startSlide('TP 1 : Veille & Synthèse Stratégique sur Make (40 min)', 'Atelier Make', '00h15 - 00h55', C.makePurple);

drawBanner(40, doc.y, CW, 50, 'OBJECTIF MÉTIER DU TP 1', 'Construire un scénario Make qui intercepte un flux RSS d\'actualités tech, le fait résumer et noter par l\'IA (de 1 à 10), puis envoie une alerte prioritaire uniquement si le score est >= 7.', 'info');

drawDiagram(40, 140, CW, 85, 
`[1. Flux RSS: TechCrunch] ---> [2. OpenAI / Gemini LLM] ---> [3. Parse JSON] ---> [4. Router]
                                                                                     |--> (Score >= 7) ---> [Email / Slack]
                                                                                     +--> (Score < 7)  ---> [Google Sheets]`);

const cWTP1 = (CW - 24) / 3;
const s6Y = 240;
drawCard(40, s6Y, cWTP1, 145, '1. Capture Événementielle', 'Interroger un flux RSS technologique et extraire les champs dynamiques (titre, contenu, date) pour les rendre manipulables.', C.makePurple);
drawCard(40 + cWTP1 + 12, s6Y, cWTP1, 145, '2. Cerveau Analytique', 'Contraindre un LLM (GPT-4o-mini ou Gemini) à produire une réponse au format JSON strict avec note et synthèse.', C.makePurple);
drawCard(40 + (cWTP1 + 12) * 2, s6Y, cWTP1, 145, '3. Décision Algorithmique', 'Parser le JSON reçu et poser un filtre numérique conditionnel sur le Router pour aiguiller le message.', C.makePurple);

// ========================================================
// SLIDE 7 : TP 1 ÉTAPE 1 (TRIGGER RSS)
// ========================================================
startSlide('TP 1 : Étape 1 — Configuration du Déclencheur RSS', 'Atelier Make', '00h15 - 00h25', C.makePurple);

const s7Y = doc.y;
drawCard(40, s7Y, wHalf, 185, 'Consignes Pas-à-Pas', 
  '1. Connectez-vous sur make.com et cliquez sur "Create a new scenario".\n\n' +
  '2. Cliquez sur le gros bouton + au centre et cherchez le module RSS.\n\n' +
  '3. Choisissez l\'action : "Watch RSS feed items".\n\n' +
  '4. Entrez l\'URL du flux d\'actualités tech de test :\n' +
  '   https://techcrunch.com/feed/\n\n' +
  '5. Fixez "Maximum number of returned items" à 1.');

drawCard(40 + wHalf + 20, s7Y, wHalf, 185, '[ACTION CLÉ] : "Run this module only"', 
  'Une fois le module configuré :\n\n' +
  '• Faites un clic droit sur la bulle RSS.\n' +
  '• Cliquez sur "Run this module only".\n\n' +
  'Pourquoi cette étape est capitale ?\n' +
  'Make doit contacter le flux une première fois pour analyser le format des données et enregistrer les variables (title, description, pubDate). Ces variables apparaîtront ensuite sous forme de pastilles cliquables dans les modules suivants !', C.amber, C.amberBg);

drawBanner(40, s7Y + 198, CW, 55, 'PIÈGE CLASSIQUE À ÉVITER', 'Si vous ne réglez pas la limite à 1 article, Make va traiter 50 articles d\'un coup lors du premier test et consommera la moitié de vos opérations gratuites du mois !', 'warning');

// ========================================================
// SLIDE 8 : TP 1 ÉTAPE 2 (MODULE LLM & PROMPT STRICT)
// ========================================================
startSlide('TP 1 : Étape 2 — Connexion IA & Prompt Système Strict', 'Atelier Make', '00h25 - 00h35', C.makePurple);

drawCard(40, doc.y, CW, 50, 'Configuration du Module OpenAI / Gemini', 
  'Ajoutez le module OpenAI "Create a Chat Completion" (ou Google Gemini). Modèle conseillé : gpt-4o-mini ou gemini-1.5-flash.\n' +
  'User Message : Tapez "Titre : " et déposez la variable {{1.title}}, puis "Contenu : " et déposez {{1.description}}.');

drawCode(40, 145, CW, 180, 
`// À coller rigoureusement dans le champ "Role: System" :
Tu es un analyste de veille stratégique et technologique.
Pour chaque article soumis, analyse le contenu et renvoie UNIQUEMENT un objet JSON strictement valide au format ci-dessous, sans texte introductif ni balises markdown :
{
  "titre_court": "Titre synthétique en 5 mots",
  "resume_executif": "Résumé clair et percutant en 2 phrases",
  "score_pertinence": (Nombre entier entre 1 et 10),
  "thematique": "Une catégorie parmi: IA, Sécurité, Business",
  "action_recommandee": "Action concrète recommandée"
}`, 'Prompt Système de Structuration de Données');

drawBanner(40, 340, CW, 55, 'LE PRINCIPE DU SCHEMA STRICT', 'Sans consigne stricte, le LLM ajoutera des phrases de politesse ("Voici le résumé...") qui feront planter le traitement automatisé suivant. Imposer un format JSON pur est la clé de la fiabilité.', 'info');

// ========================================================
// SLIDE 9 : TP 1 ÉTAPES 3 & 4 (PARSER & ROUTER)
// ========================================================
startSlide('TP 1 : Étapes 3 & 4 — Parser le JSON & Router Conditionnel', 'Atelier Make', '00h35 - 00h45', C.makePurple);

const s9Y = doc.y;
drawCard(40, s9Y, wHalf, 175, 'Étape 3 : Le Module "Parse JSON"', 
  'Le modèle de langage a renvoyé du texte brut. Pour que Make puisse utiliser le score dans un filtre, il faut le convertir en vraies variables !\n\n' +
  '• Ajoutez le module natif JSON > "Parse JSON".\n' +
  '• Dans le champ "JSON String", glissez la réponse de l\'IA :\n' +
  '  {{2.choices[].message.content}}\n\n' +
  'Make extrait immédiatement les variables score_pertinence et resume_executif.');

drawCard(40 + wHalf + 20, s9Y, wHalf, 175, 'Étape 4 : Router & Filtres', 
  '• Ajoutez un module Router après le parseur JSON.\n\n' +
  '• Branche 1 (Alerte Immédiate) :\n' +
  '  Ajoutez le module Email (Send an email) ou Slack.\n' +
  '  Cliquez sur la clé à molette pour poser le filtre :\n' +
  '  Condition : {{3.score_pertinence}} >= 7 (Numeric operator).\n\n' +
  '• Branche 2 (Archivage Passif) :\n' +
  '  Ajoutez un module Google Sheets pour consigner les articles secondaires (< 7).');

drawBanner(40, s9Y + 188, CW, 75, 'VALIDATION DU TEST EN DIRECT PAR L\'ÉTUDIANT', '1. Cliquez sur le bouton bleu "Run once" en bas à gauche de Make.\n2. Observez la loupe d\'inspection au-dessus du module JSON et visualisez la décomposition des données.\n3. Vérifiez quelle branche du Router s\'illumine selon la note attribuée par l\'IA !', 'success');

// ========================================================
// SLIDE 10 : DÉBRIEFING TP 1 & TRANSITION
// ========================================================
startSlide('Pause Active & Débriefing : Ce que Make Réussit vs Ses Limites', 'Débriefing', '00h55 - 01h05');

const s10Y = doc.y;
drawCard(40, s10Y, wHalf, 175, 'Ce que Make fait à la perfection', 
  '• Processus séquentiel et déterministe extrêmement clair.\n' +
  '• Accessibilité totale pour des profils métiers sans formation de code.\n' +
  '• Immense catalogue de connecteurs prêts à l\'emploi (+1500 apps).\n' +
  '• Idéal pour automatiser des flux administratifs, marketing ou CRM.', C.green, C.greenBg);

drawCard(40 + wHalf + 20, s10Y, wHalf, 175, 'La Limite Fondamentale de Make', 
  '• L\'humain doit prévoir à l\'avance TOUTES les branches (If/Else rigide).\n' +
  '• Le modèle de langage est passif : il répond uniquement à la question posée.\n' +
  '• Impossible pour l\'IA d\'aller chercher une information imprévue ou de décider d\'invoquer un outil externe de sa propre initiative.', C.red, C.redBg);

drawCard(40, s10Y + 188, CW, 95, 'Vers l\'IA Agentique : La Transition vers n8n', 
  'Et si nous ne programmions plus chaque embranchement manuellement ?\n' +
  'Et si nous donnions à l\'IA une boîte à outils (Calculatrice, Base de données, Recherche Web) et qu\'elle décidait elle-même quel outil déclencher en fonction de la situation ?\n\n' +
  'C\'est la révolution des Agents IA autonomes, et n8n a été entièrement repensé pour cette architecture.', C.primary, C.primaryLight);

// ========================================================
// SLIDE 11 : POURQUOI N8N POUR L'IA AGENTIQUE ?
// ========================================================
startSlide('Pourquoi n8n est taillé pour l\'IA Agentique ?', 'Architecture n8n', '01h05', C.n8nOrange);

drawDiagram(40, doc.y, CW, 120, 
`              [When Chat Message Received] (Widget Web de test)
                                    |
                                    v
     +-------------------------------------------------------------+
     |                        AI AGENT NODE                        |
     |                (Mode : Tools Agent LangChain)               |
     +--------------+-------------------------------+--------------+
                    |                               |              |
              [Model Node]                    [Memory Node]   [Tool Node]
           (OpenAI / Gemini)               (Window Buffer: 5) (Calculator)`);

const s11Y = 225;
drawCard(40, s11Y, cWTP1, 140, '1. Connecteur Model', 'Le cerveau linguistique de l\'agent (OpenAI GPT-4o, Google Gemini, Anthropic Claude ou modèle open-source local).', C.n8nOrange);
drawCard(40 + cWTP1 + 12, s11Y, cWTP1, 140, '2. Connecteur Memory', 'Maintient le contexte conversationnel (Window Buffer) pour retenir les questions et réponses précédentes.', C.n8nOrange);
drawCard(40 + (cWTP1 + 12) * 2, s11Y, cWTP1, 140, '3. Connecteur Tools', 'Les bras et les mains de l\'agent : calculatrice formelle, requêtes SQL, recherche vectorielle (RAG), appels d\'API.', C.n8nOrange);

// ========================================================
// SLIDE 12 : LE CYCLE REACT (THOUGHT / ACTION / OBSERVATION)
// ========================================================
startSlide('Comment Raisonne un Agent IA : Le Pattern ReAct', 'Théorie Agentique', '01h10', C.n8nOrange);

const s12Y = doc.y;
drawCard(40, s12Y, wHalf, 255, 'La Boucle Cognitive de Raisonnement', 
  'Un agent autonome ne répond pas d\'un seul bloc.\nIl exécute une boucle formalisée (ReAct) :\n\n' +
  '1. Thought (Pensée) :\n' +
  '   L\'agent analyse la demande de l\'utilisateur et formule une stratégie :\n' +
  '   "L\'utilisateur me demande un calcul financier complexe, je ne dois pas deviner le résultat".\n\n' +
  '2. Action :\n' +
  '   Il sélectionne et appelle l\'outil adapté :\n' +
  '   "J\'invoque l\'outil Calculator avec l\'opération arithmétique".\n\n' +
  '3. Observation :\n' +
  '   Il lit la réponse exacte renvoyée par l\'outil externe.\n\n' +
  '4. Final Answer :\n' +
  '   Il formule une réponse courtoise intégrant la valeur exacte.');

drawCode(40 + wHalf + 20, s12Y, wHalf, 255, 
`// Ce que l'étudiant va observer dans n8n :

Thought: The user is asking for a commercial discount
calculation. I must use the Calculator tool.

Action: Calculator
Action Input: 18 * 849.90 * 0.88 * 1.20

Observation: 16147.20

Thought: I now have the exact price with tax.
Final Answer: Le montant total TTC après application
de la remise de 12% et de la TVA de 20% est
exactement de 16 147,20 euros.`, 'Journal d\'Exécution Réel (Trace ReAct)');

// ========================================================
// SLIDE 13 : TP 2 ÉTAPE 1 & 2 (N8N INITIALISATION)
// ========================================================
startSlide('TP 2 : Étapes 1 & 2 — Initialiser le Workflow & l\'AI Agent', 'Atelier n8n', '01h15 - 01h25', C.n8nOrange);

const s13Y = doc.y;
drawCard(40, s13Y, wHalf, 190, 'Étape 1 : Le Déclencheur Chat', 
  '1. Ouvrez votre instance n8n (Cloud ou local).\n\n' +
  '2. Cliquez sur "Add workflow" en haut à droite.\n\n' +
  '3. Cliquez sur "Add first step" et recherchez :\n' +
  '   "When chat message received" (Chat Trigger).\n\n' +
  'Ce nœud crée automatiquement une interface de messagerie instantanée intégrée pour tester l\'agent sans aucune interface externe !');

drawCard(40 + wHalf + 20, s13Y, wHalf, 190, 'Étape 2 : Le Nœud "AI Agent"', 
  '1. Cliquez sur le bouton + à la sortie du Chat Trigger.\n\n' +
  '2. Cherchez le nœud "AI Agent" (catégorie Advanced AI).\n\n' +
  '3. Sélectionnez le mode : "Tools Agent".\n\n' +
  '4. Observez bien le nœud :\n' +
  '   Il possède 3 connecteurs sous sa base :\n' +
  '   • Model (Cerveau)\n' +
  '   • Memory (Mémoire)\n' +
  '   • Tool (Capacités d\'action)');

drawBanner(40, s13Y + 202, CW, 60, 'DIFFÉRENCE FONDAMENTALE D\'INTERFACE', 'Dans Make, les modules sont reliés de gauche à droite sur une ligne séquentielle. Dans n8n, le nœud AI Agent agit comme un orchestrateur central auquel on raccorde des sous-capacités verticalement.', 'info');

// ========================================================
// SLIDE 14 : TP 2 ÉTAPE 3 & 4 (MODEL, MEMORY, CALCULATOR)
// ========================================================
startSlide('TP 2 : Étapes 3 & 4 — Brancher Model, Memory & Calculator', 'Atelier n8n', '01h25 - 01h35', C.n8nOrange);

const s14Y = doc.y;
drawCard(40, s14Y, cWTP1, 115, '1. Connecteur Model', 'Branchez un nœud "OpenAI Chat Model" (modèle gpt-4o-mini) ou "Google Gemini Chat Model".', C.n8nOrange);
drawCard(40 + cWTP1 + 12, s14Y, cWTP1, 115, '2. Connecteur Memory', 'Branchez un nœud "Window Buffer Memory" et réglez la taille d\'historique sur 5 messages.', C.n8nOrange);
drawCard(40 + (cWTP1 + 12) * 2, s14Y, cWTP1, 115, '3. Connecteur Tool', 'Branchez l\'outil natif "Calculator" sous le port Tool pour déléguer les opérations mathématiques.', C.n8nOrange);

drawCode(40, s14Y + 126, CW, 135, 
`// À coller dans le champ "System Message" du nœud AI Agent :
Tu es l'assistant commercial d'une société informatique. Tu réponds toujours en français de façon concise et courtoise.
RÈGLE ABSOLUE : Dès qu'une question implique un calcul chiffré, des pourcentages, des remises commerciales ou des taxes, tu DOIS impérativement utiliser ton outil "Calculator" pour garantir un résultat exact au centime près. Ne devine jamais les chiffres par toi-même.`, 'Consignes Système de l\'Agent (System Message)');

drawBanner(40, s14Y + 270, CW, 45, 'POURQUOI CETTE CONSIGNE ?', 'Les modèles de langage sont entraînés pour prédire des mots, pas pour calculer. L\'instruction système leur apprend à reconnaître leurs limites et à déléguer à l\'outil spécialisé.', 'warning');

// ========================================================
// SLIDE 15 : TP 2 TESTS EN DIRECT & OBSERVATION TRACE
// ========================================================
startSlide('TP 2 : Étape 5 — Tests en Direct & Observation des Traces', 'Atelier n8n', '01h35 - 01h45', C.n8nOrange);

const s15Y = doc.y;
drawCard(40, s15Y, cWTP1, 160, 'Test 1 : Dialogue sans outil', 
  'Invite à tester :\n' +
  '"Bonjour, que vends-tu comme matériel ?"\n\n' +
  'Résultat attendu :\n' +
  'L\'agent répond directement avec courtoisie en quelques millisecondes sans solliciter l\'outil Calculator.', C.slate200, C.white);

drawCard(40 + cWTP1 + 12, s15Y, cWTP1, 160, 'Test 2 : Appel de l\'Outil', 
  'Invite à tester :\n' +
  '"Un client commande 18 ordinateurs à 849,90 € HT avec 12% de remise et 20% de TVA. Quel est le montant TTC ?"\n\n' +
  'Résultat attendu :\n' +
  'L\'agent invoque la calculatrice et fournit le montant exact au centime près (16 147,20 €).', C.n8nOrange, '#FFF7ED');

drawCard(40 + (cWTP1 + 12) * 2, s15Y, cWTP1, 160, 'Test 3 : Test de Mémoire', 
  'Invite à tester :\n' +
  '"Rappelle-moi quel était le prix unitaire d\'un ordinateur dont nous parlions ?"\n\n' +
  'Résultat attendu :\n' +
  'Grâce au nœud Window Buffer Memory, l\'agent retrouve immédiatement la valeur 849,90 € !', C.slate200, C.white);

drawBanner(40, s15Y + 172, CW, 75, 'LE MOMENT CLÉ POUR LES ÉTUDIANTS', 'Faites ouvrir l\'onglet "Execution Details" (historique des exécutions) : montrez la ligne Thought ! Les étudiants visualisent littéralement le raisonnement interne de l\'agent avant qu\'il n\'exécute l\'action.', 'success');

// ========================================================
// SLIDE 16 : LES 4 RÈGLES DE PRODUCTION
// ========================================================
startSlide('Les 4 Règles d\'Or de l\'Automatisation en Production', 'Sécurité & Prod', '01h45');

const s16Y = doc.y;
drawCard(40, s16Y, wHalf, 125, '1. Zéro Clé d\'API en clair', 
  'Ne collez JAMAIS une clé d\'API dans un prompt ou un corps de webhook.\n' +
  'Utilisez systématiquement les gestionnaires sécurisés d\'identifiants (Credentials n8n / Connections Make) chiffrés sur le serveur.', C.red, C.redBg);

drawCard(40 + wHalf + 20, s16Y, wHalf, 125, '2. Prévention des Boucles Infinies', 
  'Un bot qui répond automatiquement par email peut boucler avec le répondeur d\'absence du destinataire jusqu\'à épuiser votre solde.\n' +
  'Placez toujours un filtre qui ignore les emails contenant "Auto-reply" ou "Out of office".', C.amber, C.amberBg);

drawCard(40, s16Y + 135, wHalf, 125, '3. Modération des Tokens', 
  'Chaque exécution consomme des tokens payants.\n' +
  'Ne transmettez pas un document entier de 50 pages si 5 lignes suffisent. Tronquez et filtrez les données en amont pour diviser vos factures par 10.', C.primary, C.blueBg);

drawCard(40 + wHalf + 20, s16Y + 135, wHalf, 125, '4. Human-in-the-Loop', 
  'Pour les actions sensibles (virement d\'argent, suppression de données, envoi d\'email à un client VIP), l\'IA doit rédiger un brouillon soumis à la validation d\'un humain par un bouton.', C.green, C.greenBg);

// ========================================================
// SLIDE 17 : QUIZ D'ÉVALUATION (QUESTIONS 1 À 3)
// ========================================================
startSlide('Quiz d\'Évaluation des Acquis (Questions 1 à 3)', 'Quiz Interactif', '01h50');

const s17Y = doc.y;
drawCard(40, s17Y, CW, 75, '1. Quelle est la différence fondamentale entre un Polling et un Webhook ?', 
  'a) Le polling coûte plus cher en calcul serveur.\n' +
  'b) Le polling interroge périodiquement la source, tandis que le webhook est alerté instantanément par l\'événement. (VRAI)\n' +
  'c) Le webhook ne sait pas transporter de format JSON.');

drawCard(40, s17Y + 85, CW, 75, '2. Pourquoi intercaler un module "Parse JSON" après l\'appel IA dans Make ?', 
  'a) Pour traduire la réponse de l\'anglais vers le français.\n' +
  'b) Pour transformer la chaîne textuelle brute du LLM en variables individuelles exploitables par les filtres. (VRAI)\n' +
  'c) Pour sécuriser la clé d\'API.');

drawCard(40, s17Y + 170, CW, 75, '3. En quoi le nœud "AI Agent" de n8n diffère-t-il d\'un flux séquentiel classique ?', 
  'a) Il est gratuit et ne consomme aucun crédit d\'API.\n' +
  'b) Il décide lui-même d\'invoquer ou non des outils connectés en fonction du besoin de l\'utilisateur. (VRAI)\n' +
  'c) Il ne peut traiter que des fichiers Excel.');

// ========================================================
// SLIDE 18 : QUIZ (QUESTIONS 4 & 5) + MINI-DÉFI
// ========================================================
startSlide('Quiz d\'Évaluation (Questions 4 & 5) & Mini-Défi', 'Quiz & Défi', '01h55');

const s18Y = doc.y;
drawCard(40, s18Y, wHalf, 115, '4. Pourquoi déléguer les calculs à "Calculator" ?', 
  'a) Les LLMs ont tendance à faire des erreurs sur les calculs précis et les arrondis financiers. (VRAI)\n' +
  'b) L\'outil Calculator est plus écologique.\n' +
  'c) Le LLM refuse catégoriquement de lire des chiffres.');

drawCard(40 + wHalf + 20, s18Y, wHalf, 115, '5. Pour une banque exigeant le secret bancaire strict :', 
  'a) Make.com en offre gratuite.\n' +
  'b) n8n déployé en On-premise (Docker interne) couplé à un LLM local souverain (Ollama/Mistral). (VRAI)\n' +
  'c) Zapier Cloud.');

drawCard(40, s18Y + 125, CW, 130, '[MINI-DÉFI EXTENSION] Pour les étudiants en avance', 
  '• Défi Make : Ajoutez un filtre supplémentaire sur la variable "thematique" ou "sentiment" de l\'article -> si le sentiment est "Négatif / En colère", envoyez un SMS d\'alerte immédiat.\n\n' +
  '• Défi n8n : Connectez un second outil à l\'agent (ex: l\'outil Wikipedia ou Date & Time) et posez une question croisée :\n' +
  '  "Quelle est la population actuelle de Madrid et que donnerait-elle avec 18% d\'habitants en plus ?"\n' +
  '  Observez l\'agent orchestrer les deux outils successivement !', C.amber, C.amberBg);

// ========================================================
// SLIDE 19 : CONCLUSION DU CYCLE COMPLET
// ========================================================
startSlide('Conclusion du Cycle : La Vision Complète de l\'IA', 'Bilan du Cycle', '02h00');

const s19Y = doc.y;
drawCard(40, s19Y, cWTP1, 150, '1. Les Fondations', 'ChatGPT, Gemini & Perplexity\n\nVous savez dialoguer, structurer des requêtes complexes et synthétiser des volumes documentaires massifs.', C.primary, C.white);
drawCard(40 + cWTP1 + 12, s19Y, cWTP1, 150, '2. Le Prototypage', 'Lovable & Gamma\n\nVous savez générer des applications web complètes et des présentations interactives en quelques minutes.', C.primary, C.white);
drawCard(40 + (cWTP1 + 12) * 2, s19Y, cWTP1, 150, '3. L\'Orchestration', 'Make & n8n\n\nVous savez connecter ces cerveaux artificiels aux outils réels de l\'entreprise pour exécuter des processus autonomes.', C.n8nOrange, '#FFF7ED');

drawBanner(40, s19Y + 162, CW, 85, 'POUR ALLER PLUS LOIN : LES ARCHITECTURES MULTI-AGENTS', 'La prochaine frontière de l\'IA générative consiste à faire collaborer plusieurs agents autonomes spécialisés (ex: un Agent Chercheur, un Agent Rédacteur et un Agent Relecteur) orchestrés par des frameworks comme CrewAI, AutoGen ou LangGraph.', 'info');

// ========================================================
// SLIDE 20 : BOÎTE À OUTILS & RESSOURCES
// ========================================================
startSlide('Boîte à Outils & Ressources à Emporter', 'Ressources', 'Fin de Séance');

const s20Y = doc.y;
drawCard(40, s20Y, cWTP1, 160, '1. Livret de Cours PDF', 'Retrouvez le guide pédagogique complet de 5 pages avec pas-à-pas détaillés et captures textuelles dans :\ncours_ia_make_n8n/GUIDE_PEDAGOGIQUE_MAKE_N8N.pdf', C.primary);
drawCard(40 + cWTP1 + 12, s20Y, cWTP1, 160, '2. Bibliothèque Make', 'Des milliers de templates officiels prêts à être clonés en un clic pour vos prochains projets :\nmake.com/en/templates', C.makePurple);
drawCard(40 + (cWTP1 + 12) * 2, s20Y, cWTP1, 160, '3. Communauté n8n', 'La bibliothèque mondiale de workflows d\'agents IA partagés par les créateurs :\nn8n.io/workflows', C.n8nOrange);

drawBanner(40, s20Y + 172, CW, 65, 'BRAVO À TOUS POUR VOTRE PARTICIPATION !', 'Vous disposez désormais de toutes les clés pour concevoir, prototyper et automatiser des flux intelligents à haute valeur ajoutée.', 'success');

// ========================================================
// NUMÉROTATION DES PAGES & FOOTER SUR TOUTES LES SLIDES
// ========================================================
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc.page.margins.bottom = 0;

  // Ligne et texte de pied de page
  const footY = PAGE_H - 22;
  doc.strokeColor(C.slate200).lineWidth(0.5).moveTo(40, footY - 4).lineTo(40 + CW, footY - 4).stroke();
  doc.fillColor(C.slate600).font('Helvetica').fontSize(7.5).text('Module 3 : Automatisation & Orchestration IA (Make & n8n) • Cycle Formation IA Générative', 40, footY, { width: 500 });
  doc.text(`Slide ${i + 1} / ${range.count}`, 40 + CW - 100, footY, { width: 100, align: 'right' });
}

doc.end();

stream.on('finish', () => {
  console.log(`Slides PDF générées avec succès (${range.count} slides) :`, outputPath);
});
