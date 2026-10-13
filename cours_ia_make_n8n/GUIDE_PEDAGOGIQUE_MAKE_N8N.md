# MODULE 3 : AUTOMATISATION & ORCHESTRATION AVEC L'IA GÉNÉRATIVE
## Guide Pédagogique Complet & Support de Travaux Pratiques (Séance de 2h)
**Outils à l'honneur : Make & n8n**  
*Parcours de formation : "De l'Utilisateur de LLM à l'Architecte de Workflows Intelligents"*

---

## 📌 CONTEXTE & POSITIONNEMENT DANS LE CURRICULUS

Ce cours constitue le troisième volet d'un cycle de formation complet à l'Intelligence Artificielle Générative :
1. **Module 1 – Les Fondations de l'IA Générative** : Recherche augmentée, formulation de requêtes, conversation et synthèse d'informations avec *Perplexity, ChatGPT et Gemini*. (L'humain initie et guide manuellement chaque interaction).
2. **Module 2 – Le Prototypage Visuel & Rapide** : Création d'applications web interactives et de supports percutants en quelques minutes avec *Lovable* et *Gamma*. (L'IA génère des artefacts finaux prêts à l'emploi).
3. **Module 3 (Cette séance) – L'Automatisation & l'Orchestration** : Rendre l'IA autonome au sein des processus réels d'une organisation avec *Make* et *n8n*. (L'IA travaille en arrière-plan, déclenchée par des événements réels, et connectée aux outils du quotidien : emails, bases de données, CRM, messageries).

---

## ⏱️ DÉROULÉ SYNTHÉTIQUE DE LA SÉANCE (120 MINUTES)

| Timing | Étape | Objectif Pédagogique | Activité Étudiant |
|---|---|---|---|
| **00h00 - 00h15 (15 min)** | **1. Cadrage & Démystification** | Comprendre le rôle d'un orchestrateur et la différence fondamentale Make vs n8n | Écoute active, découverte des concepts de Triggers, Actions et JSON |
| **00h15 - 00h55 (40 min)** | **2. TP 1 : Make en Pratique** | Bâtir un flux séquentiel : Veille & Synthèse automatisée avec OpenAI/Gemini | Création pas-à-pas d'un scénario Make, mapping de variables et filtrage |
| **00h55 - 01h05 (10 min)** | **3. Pause & Débriefing** | Analyser les limites de Make (opérations, coûts) et introduire les Agents | Échange informel, questions/réponses |
| **01h05 - 01h45 (40 min)** | **4. TP 2 : n8n en Pratique** | Bâtir un Agent IA autonome avec mémoire et outils intégrés (AI Agent Node) | Configuration d'un agent n8n, observation du raisonnement (*Thought/Action*) |
| **01h45 - 02h00 (15 min)** | **5. Synthèse & Mini-Défi** | Consolider les acquis, bonnes pratiques de production et évaluation | Quiz interactif de 5 questions et défi d'extension |

---

## 🎯 OBJECTIFS PÉDAGOGIQUES

À l'issue de cette séance de 2 heures, chaque étudiant sera capable de :
1. **Distinguer** un usage ponctuel d'un LLM d'un processus automatisé événementiel.
2. **Choisir** judicieusement entre Make (approche no-code SaaS, rapide, idéale pour le marketing/vente) et n8n (approche technique, souveraine, idéale pour les agents autonomes et la manipulation de données).
3. **Comprendre et manipuler** les structures de données universelles échangées entre applications (JSON, clés/valeurs, tableaux).
4. **Construire et tester** un scénario fonctionnel de bout en bout sur Make intégrant un modèle de langage (qualification automatique de leads ou synthèse de flux RSS).
5. **Configurer un Agent IA autonome sur n8n** doté d'une mémoire de conversation et capable de décider seul d'invoquer un outil externe (calculateur, recherche, base de données).
6. **Appliquer les règles d'or de sécurité et de rentabilité** (protection des clés d'API, prévention des boucles infinies, maîtrise des budgets de tokens).

---

## 🛠️ PRÉ-REQUIS & MATÉRIEL NÉCESSAIRE

### Pour l'enseignant :
- Vidéoprojecteur ou partage d'écran haute résolution.
- Clé d'API de secours (OpenAI ou Google AI Studio / Gemini) au cas où un étudiant aurait un blocage technique.
- Environnement de démonstration prêt à l'emploi sur Make et n8n.

### Pour chaque étudiant :
- Un ordinateur avec connexion Internet (navigateur Chrome ou Firefox à jour).
- Un compte gratuit créé au préalable sur **Make.com** (Free Plan : 1000 opérations/mois).
- Un accès à **n8n** :
  - *Option A (Recommandée)* : Inscription au Cloud n8n (essai gratuit 14 jours sans carte bancaire sur n8n.io).
  - *Option B* : Instance n8n partagée par l'école ou n8n exécuté localement via `npx n8n`.
- Une clé d'API vers un modèle de langage :
  - Soit **Google AI Studio** (Gemini) : Clé gratuite en 2 clics sur `aistudio.google.com`.
  - Soit **OpenAI Platform** : Clé avec quelques crédits sur `platform.openai.com`.

---

# PARTIE 1 : CADRAGE THÉORIQUE & DÉMYSTIFICATION (15 MIN)

### 1.1 Du "Chatbot" à "L'Orchestrateur" : Le Changement de Paradigme
Dans les modules 1 et 2, l'étudiant était toujours présent pour taper un prompt et copier-coller le résultat. Mais dans la vie réelle d'une entreprise :
- Les données arrivent à toute heure (un formulaire de contact, un email client, une alerte serveur).
- L'humain ne peut pas passer sa journée à faire des copier-coller dans ChatGPT.
- **La solution : L'orchestration d'API.** Un orchestrateur est un chef d'orchestre numérique qui écoute un événement déclencheur, transmet l'information à l'IA pour analyse, puis diffuse la décision aux bons outils.

### 1.2 L'Anatomie d'un Workflow Intelligent
Tout flux d'automatisation repose sur 4 briques fondamentales :
1. **Le Déclencheur (Trigger)** : L'événement initial.
   - *Polling* : L'orchestrateur vérifie toutes les 15 minutes s'il y a du nouveau (ex: nouvelle ligne Google Sheets).
   - *Webhook (Instantané)* : L'application externe envoie immédiatement la donnée dès qu'elle se produit.
2. **Le Conteneur de Données (JSON)** : La langue universelle des API.
   ```json
   {
     "nom": "Dupont",
     "email": "contact@dupont.com",
     "message": "Besoin urgent d'un devis pour 50 licences."
   }
   ```
3. **Le Module IA (LLM Connector)** : Le cerveau du flux. On lui transmet la donnée brute dans un *Prompt Système*, et il renvoie une analyse structurée (catégorie, sentiment, résumé, réponse rédigée).
4. **L'Action & le Routeur** : La prise de décision.
   - Si l'IA estime que le message est "Urgent" -> Envoi d'un SMS ou notification Slack immédiate.
   - Si le message est "Standard" -> Enregistrement simple dans Notion.

### 1.3 Make vs n8n : Le Grand Comparatif

| Critère | Make (ex-Integromat) | n8n |
|---|---|---|
| **Philosophie** | No-code visuel, orienté métier & business | Fair-code, orienté technique, développeurs & agents |
| **Hébergement** | 100% Cloud (SaaS propriétaire) | Cloud OU Auto-hébergement (Docker, serveur souverain) |
| **Prise en main** | Immédiate, interface circulaire ludique | Légèrement plus technique (notions de JSON/JS utiles) |
| **Intégrations** | +1500 connecteurs natifs très stables | +400 connecteurs + Nœud HTTP universel ultra-puissant |
| **Gestion de l'IA** | Modules séquentiels (OpenAI, Gemini) | Nœud **"AI Agent"** natif (LangChain, outils autonomes, RAG) |
| **Modèle économique** | Facturation au nombre d'opérations (modules exécutés) | Facturation aux exécutions de workflows (Cloud) ou gratuit (Self-host) |
| **Idéal pour...** | PME, marketeurs, automatisations rapides | Startups tech, conformité RGPD stricte, agents IA complexes |

---

# PARTIE 2 : ATELIER PRATIQUE 1 — MAKE (40 MIN)
## Sujet : "L'Assistant Intelligent de Veille & Qualification Automatique"

### 🎯 Objectif du TP
Construire un scénario Make qui intercepte automatiquement une nouvelle information (ici, un article de veille ou un message client), demande à une IA d'analyser le contenu selon des critères stricts (note d'importance sur 10, résumé en 2 phrases, étiquettes thématiques), puis prend une décision conditionnelle (alerte immédiate si la note est supérieure à 7).

```
[Trigger: RSS ou Webhook] 
       ↓ 
[Module IA: OpenAI / Gemini] 
       ↓ 
[Module JSON: Parse JSON] 
       ↓ 
   [Routeur]
   ├── (Si Score >= 7) ──→ [Notification Email / Slack / Discord]
   └── (Si Score < 7)  ──→ [Archivage Google Sheets / Airtable]
```

### 📋 Guide Pas-à-Pas pour l'Étudiant

#### Étape 1 : Créer le Scénario et Définir le Trigger (8 min)
1. Rendez-vous sur votre tableau de bord **Make.com** et cliquez sur **"Create a new scenario"** en haut à droite.
2. Cliquez sur le gros bouton central **+** pour ajouter le premier module.
3. Recherchez le module **RSS** et sélectionnez l'événement **"Watch RSS feed items"**.
   - *URL du flux de test* : Entrez un flux d'actualités technologiques (ex: `https://techcrunch.com/feed/` ou `https://www.lemonde.fr/pixels/rss_full.xml`).
   - *Maximum number of returned items* : Réglez sur `1` pour éviter de consommer vos crédits d'un coup.
4. Cliquez sur **OK**. Faites un clic droit sur le module RSS > **"Run this module only"** pour récupérer un premier exemple de données réelles (Titre, Description, Date).

#### Étape 2 : Connecter l'Intelligence Artificielle (12 min)
1. Cliquez sur le petit demi-cercle à droite du module RSS pour ajouter un nouveau module.
2. Choisissez **OpenAI** (ou **Google AI / Gemini** selon vos accès).
3. Sélectionnez l'action **"Create a Completion"** ou **"Create a Chat Completion"**.
4. Dans les paramètres :
   - *Model* : Choisissez un modèle rapide et économique : `gpt-4o-mini` ou `gemini-1.5-flash`.
   - *Role System* : Copiez-collez scrupuleusement ce prompt :
     ```text
     Tu es un analyste en veille stratégique et technologique.
     Tu reçois un article composé d'un titre et d'un résumé.
     Ta mission est d'extraire la substantifique moelle et de renvoyer UNIQUEMENT un objet JSON valide, sans texte d'introduction ni backticks markdown.

     Le format JSON obligatoire est :
     {
       "titre_court": "Titre synthétique en 5 mots max",
       "resume_impactant": "Résumé en 2 phrases précises en français",
       "score_importance": Un nombre entier entre 1 et 10,
       "thematique": "Une catégorie parmi: IA, Cybersécurité, Business, Autre",
       "action_suggeree": "Ce qu'une équipe doit faire face à cette actualité"
     }
     ```
   - *Role User* : Cliquez dans le champ et utilisez le sélecteur de variables visuelles de Make pour insérer :
     `Titre : {{1.title}}`  
     `Contenu : {{1.description}}`
5. Cliquez sur **OK**.

#### Étape 3 : Structurer la Réponse avec le Parseur JSON (8 min)
L'IA a renvoyé une chaîne de caractères textuelle. Pour que Make puisse utiliser le champ `score_importance` dans un filtre, il faut convertir ce texte en vraies variables exploitables.
1. Ajoutez un module **JSON** (icône verte `{ }`) et choisissez **"Parse JSON"**.
2. Dans le champ **JSON String**, glissez la variable de réponse de l'IA : `{{2.choices[].message.content}}`.
3. Cliquez sur **OK**.

#### Étape 4 : Mettre en Place le Routage Conditionnel (8 min)
1. Après le module JSON, ajoutez un **Router** (module natif de Make qui sépare le flux en plusieurs branches).
2. Créez deux branches :
   - **Branche 1 (Prioritaire)** : Ajoutez un module **Email** (Send an email) ou **Slack / Discord** (Create a Message).
     - Cliquez sur la petite clé à molette entre le Router et ce module pour configurer un **Filtre** :
     - *Nom du filtre* : `Actualité Critique (Score >= 7)`
     - *Condition* : Sélectionnez la variable `{{3.score_importance}}` provenant du Parseur JSON.
     - *Opérateur* : **Numeric operator: Greater than or equal to** (`>=`).
     - *Valeur* : `7`.
   - **Branche 2 (Veille standard)** : Ajoutez un module **Google Sheets** (Add a row) ou un module **Tools > Set Variable** pour simuler l'archivage.
     - *Nom du filtre* : `Score < 7`.

#### Étape 5 : Test en Direct & Analyse du Scénario (4 min)
1. Cliquez sur le bouton bleu **"Run once"** en bas à gauche.
2. Observez l'animation visuelle :
   - La loupe du module RSS s'allume (capture du flux).
   - Le module IA traite la requête.
   - Les bulles de données (numéros au-dessus des modules) s'affichent : inspectez le paquet JSON reçu !
   - Le routeur choisit l'une des deux branches en fonction du filtre.
3. Bravo ! Vous venez de créer votre première chaîne de traitement autonome dopée à l'IA.

---

# PARTIE 3 : ATELIER PRATIQUE 2 — N8N (40 MIN)
## Sujet : "Construire un Agent IA Autonome avec Mémoire et Outils"

### 🎯 Objectif du TP
Comprendre la différence entre un *flux séquentiel rigide* (Make) et un *Agent IA autonome* (n8n). Dans ce TP, vous allez configurer un Agent n8n capable de converser, de retenir l'historique des échanges, et surtout de **décider de manière autonome** s'il a besoin d'exécuter un calcul arithmétique précis via un outil dédié.

```
                    ┌─────────────────────────┐
                    │    Chat Trigger Node    │
                    │ (Interface Utilisateur) │
                    └────────────┬────────────┘
                                 │ (Message)
                                 ▼
                    ┌─────────────────────────┐
                    │      AI AGENT NODE      │
                    │   (Orchestrateur Lang)  │
                    └───┬────────┬────────┬───┘
                        │        │        │
   ┌────────────────────┘        │        └─────────────────────┐
   ▼                             ▼                              ▼
┌──────────────┐          ┌──────────────┐              ┌──────────────┐
│ Model Node   │          │ Memory Node  │              │ Tool Node    │
│ OpenAI/Gemini│          │ Window Buffer│              │ Calculator   │
└──────────────┘          └──────────────┘              └──────────────┘
```

### 📋 Guide Pas-à-Pas pour l'Étudiant

#### Étape 1 : Initialisation du Workflow n8n (6 min)
1. Ouvrez votre instance **n8n** (Cloud ou local).
2. Cliquez sur **"Add Workflow"** (en haut à droite).
3. Cliquez sur **"Add first step"** et cherchez le déclencheur : **"When chat message received"** (Chat Trigger).
4. Ce nœud génère automatiquement une interface de chat web interactive pour tester vos créations en temps réel.

#### Étape 2 : Le Cœur du Réacteur — Le Nœud AI Agent (10 min)
1. Cliquez sur le bouton **+** à la sortie du Chat Trigger.
2. Dans la bibliothèque, cherchez **"AI Agent"** (situé dans la catégorie *Advanced AI*).
3. Sélectionnez le mode : **Tools Agent** (l'agent standard capable de raisonner et d'invoquer des fonctions).
4. Observez attentivement la forme du nœud AI Agent : il possède une sortie principale, mais aussi **3 connecteurs en bas** :
   - *Model* (le cerveau linguistique).
   - *Memory* (la mémoire des conversations passées).
   - *Tools* (les mains et les bras de l'agent : calculs, requêtes SQL, API).

#### Étape 3 : Brancher le Modèle et la Mémoire (10 min)
1. **Connecteur Model** :
   - Cliquez sur le connecteur *Model* sous le nœud AI Agent.
   - Choisissez **OpenAI Chat Model** (ou **Google Gemini Chat Model**).
   - Sélectionnez votre credential (clé d'API) et choisissez le modèle `gpt-4o-mini` (ou `gemini-1.5-flash`).
2. **Connecteur Memory** :
   - Cliquez sur le connecteur *Memory*.
   - Choisissez **Window Buffer Memory**.
   - Réglez le paramètre *Session Key* sur la valeur par défaut et la taille de la mémoire sur `5` (l'agent se rappellera des 5 derniers messages).

#### Étape 4 : Donner un Pouvoir d'Action à l'Agent avec un "Tool" (8 min)
Les LLMs sont réputés pour être mauvais en calcul mental exact et en logique formelle. Donnons-lui un outil spécialisé !
1. Cliquez sur le connecteur **Tool** sous le nœud AI Agent.
2. Choisissez l'outil **Calculator** (outil natif de calcul mathématique strict).
3. Retournez dans les paramètres du nœud **AI Agent** et entrez les instructions système (System Message) :
   ```text
   Tu es un assistant virtuel d'entreprise rigoureux et courtois.
   Réponds toujours en français.
   RÈGLE D'OR : Dès qu'une question implique un calcul chiffré, des pourcentages, des remises ou des multiplications, tu DOIS impérativement utiliser l'outil Calculator pour garantir une exactitude absolue au centime près.
   Ne devine jamais les chiffres par toi-même.
   ```

#### Étape 5 : Test Interactif & Observation du Raisonnement (6 min)
1. En bas de l'écran n8n, cliquez sur l'onglet **"Chat"**.
2. **Test 1 (Conversation simple sans outil)** :
   - Tapez : *"Bonjour ! Quel est ton rôle et qui t'a configuré ?"*
   - Observez : L'agent répond directement en quelques millisecondes sans faire appel à l'outil.
3. **Test 2 (Déclenchement autonome de l'outil)** :
   - Tapez : *"Notre client commande 18 ordinateurs à 849,90 euros l'unité. Nous lui accordons une remise commerciale de 12% puis nous devons ajouter 20% de TVA. Quel est le montant total TTC final à facturer ?"*
   - Observez le journal d'exécution (*Execution trace*) :
     1. **Thought** : *"L'utilisateur demande un calcul commercial complexe, je dois utiliser Calculator."*
     2. **Action** : L'agent formule l'équation pour l'outil Calculator.
     3. **Observation** : L'outil renvoie la valeur arithmétique exacte.
     4. **Final Answer** : L'agent formule une phrase soignée avec le résultat exact.
4. **Test 3 (Test de mémoire)** :
   - Tapez : *"Rappelle-moi quel était le prix unitaire d'un ordinateur dont on parlait juste avant ?"*
   - Observez : Grâce au nœud Memory, l'agent répond immédiatement *849,90 euros* !

---

# PARTIE 4 : SYNTHÈSE, SÉCURITÉ & BONNES PRATIQUES (15 MIN)

### 4.1 La Fiche Synthèse : Make vs n8n

| Cas d'Usage | Choisir Make | Choisir n8n |
|---|:---:|:---:|
| Automatiser les formulaires Google Form / Typeform vers Notion | ⭐️⭐️⭐️ | ⭐️⭐️ |
| Créer un agent conversationnel avec mémoire et actions dynamiques | ⭐️ | ⭐️⭐️⭐️ |
| Respect strict du RGPD / Données sensibles médicales ou bancaires | ⭐️ (SaaS) | ⭐️⭐️⭐️ (Self-hosted) |
| Flux nécessitant du code JavaScript complexe et du parsing JSON poussé | ⭐️ | ⭐️⭐️⭐️ |
| Équipe 100% non-technique (RH, Marketing, Vente) | ⭐️⭐️⭐️ | ⭐️ |

### 4.2 Les 5 Règles d'Or en Production
1. **Gestion des Secrets** : Ne collez JAMAIS une clé d'API en texte clair dans un bloc de texte ou un webhook. Utilisez toujours les trousseaux de clés sécurisés (*Connections* sur Make, *Credentials* sur n8n).
2. **Maîtrise des Coûts (Tokens)** : Chaque exécution consomme des tokens. Limitez les données inutiles transmises au LLM (ne lui passez pas un document de 50 pages si un extrait de 5 lignes suffit).
3. **Prévention des Boucles Infinies** : Attention aux scénarios du type *"Quand un email arrive, l'IA répond par email"*. Si le destinataire a un répondeur automatique, les deux IA vont se répondre indéfiniment jusqu'à épuiser votre compte en banque !
4. **Gestion des Erreurs (Fallback)** : Un modèle de langage peut être indisponible (erreur HTTP 503) ou halluciner un format JSON invalide. Prévoyez toujours une branche de contournement (*Error Handler* sur Make, *Error Trigger* sur n8n).
5. **Validation Humaine (Human-in-the-Loop)** : Pour les actions critiques (remboursement d'argent, envoi d'un email à un client VIP, suppression d'un compte), l'IA doit préparer le brouillon, mais un humain doit cliquer sur un bouton pour valider l'envoi.

---

# 🧠 QUIZ D'ÉVALUATION DE FIN DE SÉANCE (5 QUESTIONS)

1. **Dans un workflow d'automatisation, quelle est la différence entre un Polling et un Webhook ?**
   - A) Le polling est payant, le webhook est gratuit.
   - B) Le polling vérifie périodiquement s'il y a du nouveau, le webhook est alerté instantanément par l'application émettrice. *(Bonne réponse)*
   - C) Le polling ne fonctionne qu'avec l'IA.

2. **Pourquoi a-t-on besoin d'un module "Parse JSON" après avoir interrogé un LLM sur Make ?**
   - A) Pour traduire le texte de l'anglais vers le français.
   - B) Pour convertir la chaîne de caractères brute renvoyée par l'IA en variables individuelles manipulables par les modules suivants. *(Bonne réponse)*
   - C) Pour réduire le coût de la facture OpenAI.

3. **Quelle est la caractéristique majeure du nœud "AI Agent" dans n8n par rapport à un module classique ?**
   - A) Il est entièrement gratuit sans clé d'API.
   - B) Il décide lui-même d'utiliser ou non les outils qui lui sont rattachés en fonction de la consigne de l'utilisateur. *(Bonne réponse)*
   - C) Il remplace l'ensemble des autres nœuds de n8n.

4. **Quelle est la bonne pratique pour éviter une boucle infinie d'automatisation d'emails ?**
   - A) Utiliser un filtre qui ignore les emails contenant `Auto-reply`, `Out of Office` ou provenant de sa propre adresse. *(Bonne réponse)*
   - B) Ne jamais utiliser d'IA pour les emails.
   - C) Envoyer tous les emails en copie cachée.

5. **Si une entreprise médicale exige que ses données de santé ne quittent jamais son serveur interne, quel outil doit-elle privilégier ?**
   - A) Make.com en offre gratuite.
   - B) n8n déployé en auto-hébergement (On-Premise / Docker) avec un modèle local (ex: Ollama / Mistral). *(Bonne réponse)*
   - C) Zapier.

---

## 🚀 MINI-DÉFI EXTENSION (POUR LES ÉTUDIANTS LES PLUS RAPIDES)
- **Défi Make** : Ajoutez un filtre supplémentaire qui envoie un email d'alerte spécifique si le sentiment du message est "Négatif / En colère".
- **Défi n8n** : Connectez un second outil à l'AI Agent (ex: l'outil *Wikipedia* ou un outil *Custom HTTP*) et demandez à l'agent : *"Quelle est la population actuelle de Madrid et combien cela ferait-il si elle augmentait de 18% ?"*. Observez l'agent utiliser successivement les deux outils !
