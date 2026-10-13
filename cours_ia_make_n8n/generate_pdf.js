const fs = require('fs');
const path = require('path');
const PDFDocument = require('../backend/node_modules/pdfkit');

const outputPath = path.join(__dirname, 'GUIDE_PEDAGOGIQUE_MAKE_N8N.pdf');
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 35, bottom: 25, left: 45, right: 45 },
  bufferPages: true,
  autoFirstPage: false
});

const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Palette de couleurs professionnelles
const COLORS = {
  primary: '#3730A3',      // Indigo profond
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
  white: '#FFFFFF'
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - 90; // 505.28 pt

function drawSectionTitle(title, badgeText = '', badgeColor = COLORS.primary) {
  const y = doc.y;
  if (badgeText) {
    doc.roundedRect(45, y, 50, 16, 3).fill(badgeColor);
    doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(8.5).text(badgeText, 45, y + 3.5, { width: 50, align: 'center' });
    doc.fillColor(COLORS.slate900).font('Helvetica-Bold').fontSize(12).text(title, 102, y + 1.5, { width: CONTENT_WIDTH - 57 });
  } else {
    doc.fillColor(COLORS.slate900).font('Helvetica-Bold').fontSize(12).text(title, 45, y, { width: CONTENT_WIDTH });
  }
  const lineY = doc.y + 3;
  doc.strokeColor(COLORS.slate200).lineWidth(1).moveTo(45, lineY).lineTo(45 + CONTENT_WIDTH, lineY).stroke();
  doc.y = lineY + 7;
}

function drawCalloutBox(title, text, type = 'info') {
  const y = doc.y;
  let bg = COLORS.blueBg;
  let border = COLORS.primary;
  if (type === 'success') { bg = COLORS.greenBg; border = COLORS.green; }
  if (type === 'warning') { bg = COLORS.amberBg; border = COLORS.amber; }

  doc.font('Helvetica').fontSize(8);
  const textH = doc.heightOfString(text, { width: CONTENT_WIDTH - 20 });
  const boxH = textH + (title ? 18 : 12);

  doc.roundedRect(45, y, CONTENT_WIDTH, boxH, 4).fill(bg);
  doc.rect(45, y, 3.5, boxH).fill(border);

  let curY = y + 5;
  if (title) {
    doc.fillColor(border).font('Helvetica-Bold').fontSize(8).text(title, 55, curY);
    curY += 10;
  }
  doc.fillColor(COLORS.slate700).font('Helvetica').fontSize(8).text(text, 55, curY, { width: CONTENT_WIDTH - 18, lineGap: 1.5 });
  doc.y = y + boxH + 7;
}

function drawCodeCard(code, header = '') {
  const y = doc.y;
  doc.font('Courier').fontSize(7.5);
  const textH = doc.heightOfString(code, { width: CONTENT_WIDTH - 20, lineGap: 1.2 });
  const boxH = textH + (header ? 22 : 14) + 6;

  doc.roundedRect(45, y, CONTENT_WIDTH, boxH, 4).fill(COLORS.slate800);
  let curY = y + 6;
  if (header) {
    doc.fillColor('#94A3B8').font('Helvetica-Bold').fontSize(7.5).text(header, 54, curY);
    curY += 11;
  }
  doc.fillColor('#F1F5F9').font('Courier').fontSize(7.5).text(code, 54, curY, { width: CONTENT_WIDTH - 20, lineGap: 1.2 });
  doc.y = y + boxH + 6;
}

function drawCompactTable(headers, rows, colWidths, startY) {
  let y = startY !== undefined ? startY : doc.y;

  // Header
  doc.rect(45, y, CONTENT_WIDTH, 17).fill(COLORS.slate100);
  let x = 45;
  headers.forEach((h, i) => {
    doc.fillColor(COLORS.slate900).font('Helvetica-Bold').fontSize(8).text(h, x + 5, y + 4.5, { width: colWidths[i] - 10 });
    x += colWidths[i];
  });
  y += 17;
  doc.strokeColor(COLORS.slate200).lineWidth(0.8).moveTo(45, y).lineTo(45 + CONTENT_WIDTH, y).stroke();

  // Rows
  rows.forEach((row, rIdx) => {
    const isOdd = rIdx % 2 === 1;
    // Calculate row height
    let maxH = 16;
    doc.font('Helvetica').fontSize(7.5);
    row.forEach((cell, cIdx) => {
      const h = doc.heightOfString(cell, { width: colWidths[cIdx] - 10 }) + 6;
      if (h > maxH) maxH = h;
    });

    if (isOdd) {
      doc.rect(45, y, CONTENT_WIDTH, maxH).fill(COLORS.slate50);
    }
    let cellX = 45;
    row.forEach((cell, cIdx) => {
      doc.fillColor(COLORS.slate700)
         .font(cIdx === 0 ? 'Helvetica-Bold' : 'Helvetica')
         .fontSize(7.5)
         .text(cell, cellX + 5, y + 3.5, { width: colWidths[cIdx] - 10, lineGap: 1 });
      cellX += colWidths[cIdx];
    });
    y += maxH;
    doc.strokeColor(COLORS.slate200).lineWidth(0.5).moveTo(45, y).lineTo(45 + CONTENT_WIDTH, y).stroke();
  });

  doc.y = y + 7;
}

function drawStepBlock(num, title, desc, subList = []) {
  const y = doc.y;
  doc.circle(53, y + 6, 8).fill(COLORS.primary);
  doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(8).text(String(num), 45, y + 2.5, { width: 16, align: 'center' });

  doc.fillColor(COLORS.slate900).font('Helvetica-Bold').fontSize(9).text(title, 67, y + 1, { width: CONTENT_WIDTH - 22 });
  
  let curY = doc.y + 2;
  doc.fillColor(COLORS.slate700).font('Helvetica').fontSize(8).text(desc, 67, curY, { width: CONTENT_WIDTH - 22, lineGap: 1.2 });
  curY = doc.y + 2;

  subList.forEach(s => {
    doc.circle(73, curY + 3.5, 1.5).fill(COLORS.slate600);
    doc.fillColor(COLORS.slate700).font('Helvetica').fontSize(7.5).text(s, 80, curY, { width: CONTENT_WIDTH - 35, lineGap: 1.2 });
    curY = doc.y + 1.5;
  });

  doc.y = curY + 4;
}

// ========================================================
// PAGE 1 : COUVERTURE, PROGRESSION & DÉROULÉ MINUTÉ
// ========================================================
doc.addPage();

// Bannière
doc.roundedRect(45, 40, CONTENT_WIDTH, 115, 6).fill(COLORS.primary);
doc.roundedRect(55, 50, 220, 14, 7).fill('#312E81');
doc.fillColor('#E0E7FF').font('Helvetica-Bold').fontSize(7).text('CYCLE IA GÉNÉRATIVE • MODULE 3 / 3', 55, 53.5, { width: 220, align: 'center' });

doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(16).text('Automatisation & Orchestration avec l\'IA : Make & n8n', 55, 70, { width: CONTENT_WIDTH - 20 });
doc.fillColor('#CBD5E1').font('Helvetica').fontSize(8.5).text('Guide Pédagogique Complet & Support de Travaux Pratiques Intensifs (Séance de 2 heures)\nDe la simple invite de discussion ponctuelle à l\'architecture d\'agents autonomes connectés aux outils réels.', 55, 106, { width: CONTENT_WIDTH - 20, lineGap: 2 });

// Métadonnées
doc.y = 162;
doc.rect(45, doc.y, CONTENT_WIDTH, 30).fill(COLORS.slate100);
const mCol = CONTENT_WIDTH / 4;
const metaData = [
  { label: 'DURÉE', val: '2h00 (120 min)' },
  { label: 'APPROCHE', val: 'Pratique (70%)' },
  { label: 'OUTILS ÉTUDIÉS', val: 'Make & n8n' },
  { label: 'PUBLIC CIBLE', val: 'Étudiants (Tous profils)' }
];
metaData.forEach((m, i) => {
  doc.fillColor(COLORS.slate600).font('Helvetica-Bold').fontSize(6.5).text(m.label, 45 + (i * mCol) + 8, 166);
  doc.fillColor(COLORS.slate900).font('Helvetica-Bold').fontSize(8.5).text(m.val, 45 + (i * mCol) + 8, 176);
});

doc.y = 200;

// Section 1 : Continuité
drawSectionTitle('1. Continuité Pédagogique du Cycle de Formation IA');
doc.fillColor(COLORS.slate700).font('Helvetica').fontSize(8).text('Ce cours clôture une progression logique en 3 modules complémentaires :', 45, doc.y, { width: CONTENT_WIDTH });
doc.y += 4;

const cycleSteps = [
  ['Module 1 (Fondations)', 'Perplexity, ChatGPT, Gemini', 'Recherche augmentée, dialogue et synthèse d\'informations. L\'humain formule chaque prompt.'],
  ['Module 2 (Création Visuelle)', 'Lovable & Gamma', 'Génération rapide d\'applications web et de présentations percutantes. L\'IA produit des artefacts complets.'],
  ['Module 3 (Cette Séance)', 'Make & n8n (Orchestration)', 'L\'IA travaille en tâche de fond de manière autonome, déclenchée par des événements réels (emails, webhooks).']
];
drawCompactTable(['Module', 'Outils Clés', 'Posture de l\'étudiant & Compétence développée'], cycleSteps, [115, 125, 265]);

// Section 2 : Déroulé minuté
drawSectionTitle('2. Déroulé Pédagogique Minuté (120 Minutes)');
const scheduleSteps = [
  ['00h00 - 00h15 (15 min)', 'Cadrage & Démystification', 'Comprendre l\'orchestration, les Triggers, le format JSON et le match Make vs n8n', 'Théorie & Démo'],
  ['00h15 - 00h55 (40 min)', 'TP 1 : Pratique sur Make', 'Construire un flux de veille automatique avec qualification par LLM et routage conditionnel', 'TP Guidé'],
  ['00h55 - 01h05 (10 min)', 'Pause & Débriefing', 'Analyse des limites de Make, pièges des opérations et introduction aux agents autonomes', 'Échange collectif'],
  ['01h05 - 01h45 (40 min)', 'TP 2 : Pratique sur n8n', 'Bâtir un Agent IA autonome avec mémoire buffer et connecteur d\'outil Calculator', 'TP Guidé'],
  ['01h45 - 02h00 (15 min)', 'Synthèse & Mini-Défi', 'Règles de sécurité en production, gestion des tokens et quiz de validation des acquis', 'Quiz & Extension']
];
drawCompactTable(['Timing', 'Séquence', 'Objectif d\'apprentissage clé', 'Format'], scheduleSteps, [100, 115, 215, 75]);

// Section 3 : Pré-requis
drawSectionTitle('3. Pré-requis Matériels & Comptes Étudiants');
doc.fillColor(COLORS.slate700).font('Helvetica').fontSize(8).text(
  '• Un ordinateur avec navigateur Chrome ou Firefox à jour.\n' +
  '• Un compte gratuit sur Make.com (Free Tier : 1000 opérations/mois offertes).\n' +
  '• Un accès n8n : n8n Cloud (essai gratuit 14 jours sans CB) ou instance n8n locale/partagée.\n' +
  '• Une clé d\'API LLM : Google AI Studio (Gemini - gratuit en 2 clics sur aistudio.google.com) ou OpenAI Platform.',
  45, doc.y, { width: CONTENT_WIDTH, lineGap: 2 }
);

// ========================================================
// PAGE 2 : FONDAMENTAUX & MATRICE COMPARATIVE MAKE VS N8N
// ========================================================
doc.addPage();

drawSectionTitle('4. Fondamentaux : Anatomie d\'un Workflow Intelligent');
doc.fillColor(COLORS.slate700).font('Helvetica').fontSize(8).text(
  'Dans une organisation, 95% des opportunités d\'automatisation proviennent d\'événements réels : réception d\'une facture, lead dans un CRM, avis client. L\'orchestrateur fait le pont entre cet événement et le modèle de langage en s\'appuyant sur 4 composants clés :',
  45, doc.y, { width: CONTENT_WIDTH, lineGap: 1.5 }
);
doc.y += 5;

const compoRows = [
  ['1. Déclencheur (Trigger)', 'Le point d\'entrée. Soit en Polling (vérification cyclique toutes les 15 min), soit en Webhook (signal instantané envoyé par une application tierce).'],
  ['2. Données (JSON)', 'Le format clé/valeur universel pour véhiculer des informations typées sans perte (titre, date, corps de message, score).'],
  ['3. Cerveau LLM (Connecteur)', 'L\'appel API vers OpenAI (GPT-4o) ou Google (Gemini) avec un prompt système strict imposant un format de sortie prédictible.'],
  ['4. Routeur & Actions', 'La prise de décision algorithmique : si le score IA est supérieur au seuil, on alerte par SMS/Slack ; sinon, on archive en base de données.']
];
drawCompactTable(['Composant', 'Rôle et Fonctionnement'], compoRows, [140, 365]);

drawSectionTitle('5. Make vs n8n : Le Grand Comparatif Pédagogique');
const compRows = [
  ['Philosophie & Cible', '100% No-code visuel, pensé pour les équipes métier, marketing et opérations.', 'Fair-code, hybride No-code / Code (JavaScript & Python), pensé pour développeurs et tech.'],
  ['Mode d\'Hébergement', 'SaaS exclusivement sur les serveurs sécurisés de Make.', 'Cloud managé OU Auto-hébergement total (Docker, VPS privé, serveur souverain On-Premise).'],
  ['Architecture IA', 'Modules séquentiels en chaîne (Appel LLM -> Réponse -> Action suivante).', 'Nœud natif "AI Agent" (Framework LangChain : sous-nœuds Model, Memory, Tools, RAG).'],
  ['Confidentialité (RGPD)', 'Les données transitent par l\'infrastructure Cloud de Make.', 'Conformité absolue possible : déploiement local étanche sans aucune fuite externe.'],
  ['Modèle de Coût', 'Facturé au nombre d\'opérations (chaque bulle exécutée = 1 opération).', 'Facturé aux exécutions globales du flux (Cloud) ou 100% gratuit illimité (Self-hosted).'],
  ['Cas d\'usage parfait', 'Workflows linéaires, intégration d\'applications SaaS courantes (Sheets, Gmail, Notion).', 'Agents conversationnels avec outils, pipelines de données complexes, manipulation JSON/JS.']
];
drawCompactTable(['Critère', 'Make (ex-Integromat)', 'n8n'], compRows, [105, 200, 200]);

drawCalloutBox(
  'SYNTHÈSE DE POSITIONNEMENT POUR L\'ÉTUDIANT',
  'Choisissez Make lorsque la priorité est la vitesse de déploiement et la collaboration avec des non-techniciens. Choisissez n8n lorsque vous devez créer des agents IA intelligents capables d\'agir avec des outils, ou lorsque la souveraineté stricte des données est exigée.',
  'info'
);

// ========================================================
// PAGE 3 : TP 1 GUIDÉ SUR MAKE (40 MIN)
// ========================================================
doc.addPage();

drawSectionTitle('6. TP 1 Guidé sur Make : Veille & Synthèse Intelligente (40 min)', 'TP 1', COLORS.makePurple);

doc.fillColor(COLORS.slate700).font('Helvetica').fontSize(8).text(
  'Objectif : Bâtir un scénario Make qui intercepte un flux d\'informations, demande à l\'IA d\'en faire une synthèse critique avec attribution d\'une note de pertinence sur 10, puis alerte l\'équipe uniquement si l\'information est jugée prioritaire (score >= 7).',
  45, doc.y, { width: CONTENT_WIDTH, lineGap: 1.5 }
);
doc.y += 5;

drawCodeCard(
`[Flux RSS: TechCrunch] ---> [OpenAI / Gemini LLM] ---> [JSON Parse] ---> [Router]
                                                                           |--> (Score >= 7) ---> [Email / Slack / Discord]
                                                                           +--> (Score < 7)  ---> [Google Sheets / Archivage]`,
'Architecture Séquentielle du Scénario Make'
);

drawStepBlock(1, 'Créer le Scénario et Définir le Déclencheur RSS', 'Connectez-vous sur make.com, créez un nouveau scénario et ajoutez le module RSS.', [
  'Module : RSS > "Watch RSS feed items".',
  'URL du flux de test : https://techcrunch.com/feed/ (ou flux d\'actualité tech de votre choix).',
  'Maximum number of returned items : 1 (pour maîtriser la consommation des opérations de test).',
  'Clic droit sur la bulle RSS > "Run this module only" pour charger les variables réelles (title, description).'
]);

drawStepBlock(2, 'Connecter l\'Intelligence Artificielle (OpenAI ou Gemini)', 'Ajoutez le module OpenAI "Create a Chat Completion" (ou Google Gemini). Modèle conseillé : gpt-4o-mini ou gemini-1.5-flash.', [
  'Role System : Collez rigoureusement le prompt système ci-dessous imposant un format JSON strict.',
  'Role User : Glissez dynamiquement les variables du module 1 : "Titre : {{1.title}}" et "Contenu : {{1.description}}".'
]);

drawCodeCard(
`Tu es un analyste de veille stratégique. Pour chaque article soumis, renvoie UNIQUEMENT un objet JSON strictement valide au format suivant, sans texte introductif ni backticks markdown :
{
  "titre_court": "Titre percutant en 5 mots",
  "resume_executif": "Synthèse claire en 2 phrases",
  "score_pertinence": (Entier entre 1 et 10),
  "thematique": "IA, Sécurité ou Business",
  "action_recommandee": "Action concrète recommandée"
}`,
'Prompt Système Obligatoire (Format JSON strict)'
);

drawStepBlock(3, 'Structurer les Données avec le Module "Parse JSON"', 'L\'IA ayant renvoyé une chaîne textuelle brute, il faut la convertir en variables Make utilisables.', [
  'Ajoutez le module natif JSON > "Parse JSON".',
  'Dans le champ JSON String, déposez la variable réponse du module IA : {{2.choices[].message.content}}.',
  'Make transforme instantanément ce texte en variables typées (score_pertinence, resume_executif).'
]);

drawStepBlock(4, 'Mettre en Place le Router & les Filtres Conditionnels', 'Ajoutez un module Router pour aiguiller le flux vers l\'action appropriée selon la criticité de l\'actualité.', [
  'Branche 1 (Alerte Immédiate) : Module Email (Send an email) ou Slack/Discord. Cliquez sur la clé à molette pour insérer le filtre conditionnel : {{3.score_pertinence}} >= 7.',
  'Branche 2 (Archivage Passif) : Module Google Sheets ou Tools pour enregistrer les articles secondaires (< 7).'
]);

drawCalloutBox(
  'VÉRIFICATION PRATIQUE PAR L\'ÉTUDIANT',
  'Cliquez sur "Run once". Cliquez sur la bulle numérotée au-dessus du module JSON pour inspecter la décomposition des données, puis observez quelle branche du Router s\'illumine selon la note attribuée !',
  'success'
);

// ========================================================
// PAGE 4 : TP 2 GUIDÉ SUR N8N (40 MIN)
// ========================================================
doc.addPage();

drawSectionTitle('7. TP 2 Guidé sur n8n : Agent IA Autonome avec Outils (40 min)', 'TP 2', COLORS.n8nOrange);

doc.fillColor(COLORS.slate700).font('Helvetica').fontSize(8).text(
  'Révolution de posture : Dans Make, chaque étape est prédéfinie. Dans n8n, nous créons un Agent IA (architecture LangChain) qui raisonne et décide lui-même s\'il doit appeler un outil externe (Calculateur formel) ou répondre directement, tout en retenant l\'historique conversationnel.',
  45, doc.y, { width: CONTENT_WIDTH, lineGap: 1.5 }
);
doc.y += 5;

drawCodeCard(
`              [When Chat Message Received] (Widget Web de test)
                                    |
                                    v
     +-------------------------------------------------------------+
     |                        AI AGENT NODE                        |
     |                (Mode : Tools Agent LangChain)               |
     +--------------+-------------------------------+--------------+
                    |                               |              |
              [Model Node]                    [Memory Node]   [Tool Node]
           (OpenAI / Gemini)               (Window Buffer: 5) (Calculator)`,
'Architecture du Nœud AI Agent dans n8n'
);

drawStepBlock(1, 'Déclencheur "When chat message received"', 'Dans un nouveau workflow n8n, insérez le déclencheur Chat Trigger. Ce nœud active une interface graphique de chat intégrée pour tester l\'agent.');

drawStepBlock(2, 'Insérer le Nœud "AI Agent"', 'Ajoutez le nœud "AI Agent" et sélectionnez le mode "Tools Agent". Observez les 3 connecteurs d\'entrée sous le nœud : Model, Memory et Tool.');

drawStepBlock(3, 'Connecter le Modèle Linguistique et la Mémoire Buffer', 'Fournir un cerveau et une mémoire à l\'agent :', [
  'Port Model : Connectez un nœud "OpenAI Chat Model" (gpt-4o-mini) ou "Google Gemini Chat Model".',
  'Port Memory : Connectez un nœud "Window Buffer Memory" et réglez la taille à 5 messages.'
]);

drawStepBlock(4, 'Connecter l\'Outil "Calculator" et Définir la Mission', 'Confier un pouvoir d\'action spécialisé à l\'agent :', [
  'Port Tool : Connectez l\'outil natif "Calculator" (les LLM étant imprécis en calculs exacts).',
  'Ouvrez le nœud AI Agent et copiez les instructions système (System Message) ci-dessous.'
]);

drawCodeCard(
`Tu es l'assistant commercial d'une entreprise technologique. Tu réponds toujours en français de façon concise et courtoise.
RÈGLE ABSOLUE : Dès qu'une question implique un calcul chiffré, des pourcentages, des remises commerciales ou des taxes, tu DOIS impérativement utiliser ton outil "Calculator" pour garantir un résultat exact au centime près. Ne devine jamais les chiffres par toi-même.`,
'Instructions Système de l\'Agent (System Message)'
);

drawStepBlock(5, 'Batterie de Tests en Direct dans l\'Onglet Chat', 'Faites exécuter successivement ces 3 tests aux étudiants et observez le journal d\'exécution :', [
  'Test 1 (Dialogue ordinaire sans outil) : "Bonjour, que proposes-tu comme services ?" -> L\'agent répond directement sans outil.',
  'Test 2 (Raisonnement avec outil) : "Un client commande 18 ordinateurs à 849,90 € HT avec une remise de 12% puis une TVA de 20%. Quel est le montant TTC final ?" -> Observez la séquence : Thought -> Action: Calculator -> Observation -> Réponse finale !',
  'Test 3 (Test de mémoire contextuelle) : "Quel était le prix unitaire de l\'ordinateur dont nous parlions ?" -> Grâce à la mémoire buffer, l\'agent retrouve immédiatement la valeur 849,90 €.'
]);

drawCalloutBox(
  'L\'ENSEIGNEMENT MAJEUR POUR LES ÉTUDIANTS',
  'Montrez la trace d\'exécution (Execution Trace) : les étudiants voient pour la première fois la pensée interne du modèle ("Thought") avant qu\'il ne décide d\'agir. C\'est le fondement de tous les systèmes d\'agents IA modernes.',
  'info'
);

// ========================================================
// PAGE 5 : RÈGLES DE PRODUCTION, QUIZ & DÉFI
// ========================================================
doc.addPage();

drawSectionTitle('8. Les 4 Règles d\'Or en Production & Sécurité');

const prodRules = [
  ['1. Zéro Clé d\'API en clair', 'Ne collez jamais une clé d\'API dans un webhook ou un prompt. Utilisez impérativement les coffres-forts sécurisés (Credentials n8n / Connections Make).'],
  ['2. Prévention des Boucles', 'Un agent répondant automatiquement par email peut boucler avec le répondeur du destinataire. Ajoutez toujours un filtre anti-boucle (Auto-Reply, Out-of-office).'],
  ['3. Modération des Tokens', 'Ne transmettez pas un document de 50 pages si 5 lignes suffisent. Tronquez et filtrez les données en amont pour maîtriser vos coûts d\'API.'],
  ['4. Human-in-the-Loop', 'Pour les opérations irréversibles (virement, suppression de compte, email VIP), l\'IA doit rédiger un brouillon soumis à la validation d\'un humain par un bouton.']
];
drawCompactTable(['Règle de Production', 'Consigne d\'Application'], prodRules, [130, 375]);

drawSectionTitle('9. Quiz d\'Évaluation des Acquis (5 Questions)');

const quizData = [
  {
    q: '1. Quelle est la différence fondamentale entre un Polling et un Webhook ?',
    opts: [
      'a) Le polling coûte plus cher en calcul serveur.',
      'b) Le polling interroge périodiquement la source, le webhook est alerté instantanément par l\'événement. (VRAI)',
      'c) Le webhook ne sait pas transporter de JSON.'
    ]
  },
  {
    q: '2. Pourquoi intercaler un module "Parse JSON" après l\'appel IA dans Make ?',
    opts: [
      'a) Pour traduire la réponse de l\'anglais vers le français.',
      'b) Pour convertir la chaîne textuelle brute du LLM en variables individuelles exploitables par les filtres. (VRAI)',
      'c) Pour sécuriser la clé d\'API.'
    ]
  },
  {
    q: '3. En quoi le nœud "AI Agent" de n8n diffère-t-il d\'un flux séquentiel classique ?',
    opts: [
      'a) Il est gratuit et ne consomme aucun crédit d\'API.',
      'b) Il décide lui-même d\'appeler ou non des outils connectés en fonction du besoin de l\'utilisateur. (VRAI)',
      'c) Il ne peut traiter que des fichiers Excel.'
    ]
  },
  {
    q: '4. Pourquoi déléguer les calculs arithmétiques à l\'outil "Calculator" ?',
    opts: [
      'a) Les LLMs ont tendance à faire des erreurs sur les calculs précis et les arrondis financiers. (VRAI)',
      'b) L\'outil Calculator est plus écologique.',
      'c) Le LLM refuse catégoriquement de lire des chiffres.'
    ]
  },
  {
    q: '5. Si une entreprise bancaire exige que ses données ne quittent jamais ses serveurs, quelle option choisir ?',
    opts: [
      'a) Make.com en offre gratuite.',
      'b) n8n déployé en On-premise (Docker interne) couplé à un LLM local souverain (ex: Ollama/Mistral). (VRAI)',
      'c) Zapier Cloud.'
    ]
  }
];

quizData.forEach(item => {
  doc.fillColor(COLORS.slate900).font('Helvetica-Bold').fontSize(8).text(item.q, 45, doc.y, { width: CONTENT_WIDTH });
  item.opts.forEach(opt => {
    const isCorrect = opt.includes('(VRAI)');
    doc.fillColor(isCorrect ? COLORS.green : COLORS.slate600)
       .font(isCorrect ? 'Helvetica-Bold' : 'Helvetica')
       .fontSize(7.5)
       .text(opt, 55, doc.y + 1, { width: CONTENT_WIDTH - 10 });
  });
  doc.y += 3;
});

doc.y += 4;
drawCalloutBox(
  'MINI-DÉFI EXTENSION (POUR LES ÉTUDIANTS LES PLUS RAPIDES)',
  'Connectez un deuxième outil à l\'agent n8n (ex: l\'outil Wikipedia ou Date & Time) et posez-lui une question croisant les deux compétences (ex: "Quelle est la superficie de la ville de Lyon et quelle serait-elle avec 15% de surface en plus ?"). Observez l\'agent orchestrer les deux outils successivement !',
  'warning'
);

// ========================================================
// EN-TÊTES & PIEDS DE PAGE SUR TOUTES LES PAGES
// ========================================================
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc.page.margins.bottom = 0;

  // En-tête courant (pages > 0)
  if (i > 0) {
    doc.fillColor(COLORS.slate600).font('Helvetica').fontSize(7.5).text('CYCLE IA GÉNÉRATIVE • MODULE 3 : MAKE & N8N (AUTOMATISATION & AGENTS)', 45, 18, { width: CONTENT_WIDTH });
    doc.strokeColor(COLORS.slate200).lineWidth(0.5).moveTo(45, 28).lineTo(45 + CONTENT_WIDTH, 28).stroke();
  }

  // Pied de page courant (toutes pages)
  const footY = PAGE_HEIGHT - 22;
  doc.strokeColor(COLORS.slate200).lineWidth(0.5).moveTo(45, footY - 4).lineTo(45 + CONTENT_WIDTH, footY - 4).stroke();
  doc.fillColor(COLORS.slate600).font('Helvetica').fontSize(7.5).text('Guide Pratique Étudiant & Enseignant — Séance de 2h', 45, footY, { width: 300 });
  doc.text(`Page ${i + 1} sur ${range.count}`, 45 + CONTENT_WIDTH - 100, footY, { width: 100, align: 'right' });
}

doc.end();

stream.on('finish', () => {
  console.log(`PDF généré avec succès (${range.count} pages) :`, outputPath);
});
