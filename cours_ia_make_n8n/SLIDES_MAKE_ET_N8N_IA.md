# SLIDES DE PRÉSENTATION : AUTOMATISATION & ORCHESTRATION IA (MAKE & N8N)
**Cycle de Formation IA Générative • Module 3 sur 3**  
*Séance de 2 heures (120 minutes) • 70% Pratique*

---

<!-- slide -->
## Slide 1 : Titre & Introduction
### Automatisation & Orchestration avec l'IA
**Maîtriser Make & n8n pour créer des flux de travail et des agents autonomes**

#### La Trilogie Pédagogique :
- **Module 1 (Fondations)** : *ChatGPT, Gemini & Perplexity*  
  *L'humain dialogue manuellement avec l'IA dans une interface de chat.*
- **Module 2 (Création Visuelle)** : *Lovable & Gamma*  
  *L'IA produit des artefacts complets (applications web et présentations interactives).*
- **Module 3 (Cette séance)** : *Make & n8n (Orchestration)*  
  *L'IA travaille en tâche de fond de façon autonome, déclenchée par des événements réels (emails, formulaires, bases de données) et connectée aux outils du quotidien.*

---

<!-- slide -->
## Slide 2 : Planning Minuté de la Séance (120 min)
### 70% de Pratique Immédiate

| Timing | Séquence | Objectif Clé | Format |
|---|---|---|---|
| **00h00 - 00h15 (15 min)** | **1. Cadrage & Concepts Clés** | Comprendre les Triggers, le JSON et le match Make vs n8n | Théorie & Démo |
| **00h15 - 00h55 (40 min)** | **2. TP 1 : Pratique sur Make** | Bâtir un flux séquentiel : Veille & Synthèse IA avec Router | TP individuel guidé |
| **00h55 - 01h05 (10 min)** | **3. Pause Active & Débriefing** | Limites du modèle séquentiel et passage à l'IA agentique | Échange collectif |
| **01h05 - 01h45 (40 min)** | **4. TP 2 : Pratique sur n8n** | Bâtir un Agent IA autonome avec mémoire buffer et outil Calculator | TP individuel guidé |
| **01h45 - 02h00 (15 min)** | **5. Synthèse, Règles d'Or & Quiz** | Sécurité en production, gestion des tokens et validation | 5 QCM & Mini-défi |

---

<!-- slide -->
## Slide 3 : Changement de Paradigme
### Du Chatbot Ponctuel au Système Autonome Connecté

#### ❌ Le Goulot d'Étranglement Humain
Un prospect remplit un formulaire &rarr; L'employé ouvre ChatGPT &rarr; Il copie le message &rarr; Il demande une analyse &rarr; Il colle le résultat dans le CRM &rarr; Il rédige l'email manuellement.  
*Inconvénients : Lenteur, indisponibilité la nuit, risque d'erreurs.*

#### ✅ Le Flux d'Orchestration d'API
Le formulaire émet un **Webhook instantané** vers l'orchestrateur &rarr; L'orchestrateur transmet la donnée au LLM avec une consigne stricte &rarr; L'IA qualifie le lead en **1,2 seconde** &rarr; Le flux met à jour le CRM et alerte l'équipe sur Slack **24h/24**.

---

<!-- slide -->
## Slide 4 : L'Anatomie d'un Workflow Intelligent
### Les 4 Briques Universelles

1. **Le Déclencheur (Trigger)** : Le point d'entrée.
   - *Polling* : Vérification cyclique toutes les 15 minutes.
   - *Webhook* : Signal poussé instantanément par une application externe.
2. **Le Conteneur de Données (JSON)** :
   Le langage universel des API pour échanger des données structurées sans ambiguïté :
   ```json
   {
     "prospect": "Cabinet Durand",
     "besoin": "Migration urgente vers l'IA",
     "budget": 15000,
     "score_ia": 9
   }
   ```
3. **Le Module IA (LLM Connector)** :
   L'appel API (OpenAI GPT-4o, Google Gemini) recevant un Prompt Système strict + des variables dynamiques.
4. **Le Routeur & les Filtres** :
   La prise de décision algorithmique : si le score est supérieur à 7 &rarr; alerte prioritaire ; sinon archivage discret.

---

<!-- slide -->
## Slide 5 : Make vs n8n : Le Grand Match
### Quelle plateforme choisir et quand ?

| Critère | Make (ex-Integromat) | n8n |
|---|---|---|
| **Cible & Ergonomie** | 100% No-code visuel, idéal pour marketing, ventes, RH | Fair-code, hybride No-code / JS / Python pour profils techniques |
| **Hébergement** | SaaS exclusivement sur les serveurs de Make | Cloud OU **Auto-hébergé sur serveur privé** (souveraineté RGPD) |
| **Architecture IA** | Chaîne d'appels séquentiels classiques | **Nœud "AI Agent" natif** (LangChain, Outils autonomes, Mémoire) |
| **Modèle de Coût** | Facturation au nombre d'opérations (chaque bulle = 1 op) | Facturation aux flux (Cloud) ou **100% gratuit illimité** (Docker) |

> **Règle empirique :** Pour intégrer rapidement des outils SaaS grand public avec une équipe non-technique, utilisez **Make**. Pour bâtir des agents IA dotés d'outils ou avec de strictes exigences de confidentialité des données, utilisez **n8n**.

---

<!-- slide -->
## Slide 6 : TP 1 — Make en Pratique (40 min)
### Veille & Synthèse Stratégique Automatisée

```
[1. Flux RSS: TechCrunch] ---> [2. OpenAI / Gemini LLM] ---> [3. Parse JSON] ---> [4. Router]
                                                                                     |--> (Score >= 7) ---> [Email / Slack]
                                                                                     +--> (Score < 7)  ---> [Google Sheets]
```

#### Objectif Métier :
Automatiser la détection d'actualités technologiques, confier l'analyse et la notation à un LLM (score de 1 à 10), et router vers une alerte prioritaire uniquement si le score est supérieur ou égal à 7.

---

<!-- slide -->
## Slide 7 : TP 1 — Étape 1 : Le Déclencheur RSS
### Intercepter l'Information Brute

1. Sur `make.com`, cliquez sur **"Create a new scenario"**.
2. Cliquez sur le **+** central et cherchez le module **RSS**.
3. Choisissez l'événement : **"Watch RSS feed items"**.
4. URL du flux de test : `https://techcrunch.com/feed/`
5. Fixez *Maximum number of returned items* à **1**.

> **⚡️ Action Clé :** Clic droit sur la bulle RSS &rarr; **"Run this module only"** !  
> *Pourquoi ?* Make a besoin d'exécuter le déclencheur une première fois pour capturer les champs (`title`, `description`) et les rendre cliquables dans les modules suivants.

---

<!-- slide -->
## Slide 8 : TP 1 — Étape 2 : Le Cerveau IA & le Prompt de Structuration
### Forcer le Modèle à Produire du JSON Strict

Ajoutez le module **OpenAI > Create a Chat Completion** (modèle `gpt-4o-mini` ou `gemini-1.5-flash`).

#### Prompt Système Obligatoire (Role: System) :
```text
Tu es un analyste de veille stratégique. Pour chaque article soumis, renvoie UNIQUEMENT un objet JSON strictement valide au format suivant, sans texte d'introduction ni backticks markdown :
{
  "titre_court": "Titre percutant en 5 mots",
  "resume_executif": "Synthèse claire en 2 phrases",
  "score_pertinence": (Entier entre 1 et 10),
  "thematique": "IA, Sécurité ou Business",
  "action_recommandee": "Action concrète recommandée"
}
```

#### Prompt Utilisateur (Role: User) :
Insérez les variables issues du module 1 :  
`Titre : {{1.title}}`  
`Contenu : {{1.description}}`

---

<!-- slide -->
## Slide 9 : TP 1 — Étapes 3 & 4 : Parser le JSON & Router
### Transformer le Texte en Variables Opérationnelles

#### Étape 3 : Module "Parse JSON"
- Ajoutez le module natif **JSON > Parse JSON**.
- Dans *JSON String*, glissez la réponse de l'IA : `{{2.choices[].message.content}}`.
- Make extrait immédiatement les variables `score_pertinence` et `resume_executif`.

#### Étape 4 : Le Routeur & les Filtres
- Ajoutez un module **Router**.
- **Branche 1 (Alerte Immédiate)** : Module Email ou Slack avec filtre conditionnel :  
  `{{3.score_pertinence}} >= 7` (Opérateur numérique).
- **Branche 2 (Archivage Passif)** : Module Google Sheets ou Tools pour consigner les articles secondaires (`< 7`).

> **Test :** Cliquez sur **"Run once"** et observez quelle branche du Router s'illumine !

---

<!-- slide -->
## Slide 10 : Pause & Débriefing TP 1 (10 min)
### Ce que Make fait bien vs Le Besoin d'Autonomie

#### Ce que nous avons réussi avec Make :
- Un pipeline automatisé stable et visuel.
- L'injection de variables dynamiques dans un modèle de langage.
- L'aiguillage conditionnel basé sur une note générée par l'IA.

#### La Limite Fondamentale :
- Le scénario est **100% déterministe** : l'humain a dû prévoir chaque branche à l'avance.
- L'IA ne peut pas décider d'elle-même d'aller chercher une information imprévue ou d'utiliser un nouvel outil.

#### La Question Clé :
*Et si nous donnions à l'IA une boîte à outils, et qu'elle décidait seule de l'outil à employer en fonction de la question posée ?*  
&rarr; **Bienvenue dans le monde des Agents IA sur n8n.**

---

<!-- slide -->
## Slide 11 : n8n et l'Architecture de l'AI Agent
### La Révolution de l'IA Agentique

```
              [When Chat Message Received] (Widget Web de test)
                                    |
                                    v
     +-------------------------------------------------------------+
     |                        AI AGENT NODE                        |
     |                (Mode : Tools Agent LangChain)               |
     +--------------+-------------------------------+--------------+
                    |                               |              |
              [Model Node]                    [Memory Node]   [Tool Node]
           (OpenAI / Gemini)               (Window Buffer: 5) (Calculator)
```

1. **Port Model** : Fournit la capacité de réflexion linguistique.
2. **Port Memory** : Fournit la continuité contextuelle de la conversation.
3. **Port Tool** : Fournit des pouvoirs d'action dans le monde réel (calculs, bases de données, API).

---

<!-- slide -->
## Slide 12 : Comment Raisonne un Agent : Le Pattern ReAct
### Thought &rarr; Action &rarr; Observation &rarr; Final Answer

Dans un Agent autonome, l'IA suit une boucle cognitive formalisée :

```text
Thought: L'utilisateur me demande un calcul financier complexe avec une remise. 
         Je ne dois pas deviner le chiffre de tête. 
         Je dois invoquer l'outil Calculator.

Action: Calculator
Action Input: 18 * 849.90 * 0.88 * 1.20

Observation: 16147.20

Thought: J'ai maintenant la valeur arithmétique exacte au centime près.
Final Answer: Le montant total TTC final à facturer est de 16 147,20 euros.
```

---

<!-- slide -->
## Slide 13 : TP 2 — Étapes 1 & 2 : Chat Trigger & AI Agent
### Prise en Main de n8n

1. Dans votre instance n8n, cliquez sur **"Add workflow"**.
2. Ajoutez le déclencheur : **"When chat message received"** (Chat Trigger).  
   *Ce nœud offre une interface de messagerie prête pour tester l'agent.*
3. À la sortie, insérez le nœud **"AI Agent"**.
4. Sélectionnez le mode : **Tools Agent**.
5. Repérez les **3 connecteurs en bas du nœud** : Model, Memory et Tools.

---

<!-- slide -->
## Slide 14 : TP 2 — Étapes 3 & 4 : Connecter Model, Memory & Tool
### Donner un Cerveau, une Mémoire et des Bras à l'Agent

- **Port Model** : Connectez **OpenAI Chat Model** (`gpt-4o-mini`) ou **Google Gemini Chat Model**.
- **Port Memory** : Connectez **Window Buffer Memory** (taille d'historique : 5 messages).
- **Port Tool** : Connectez l'outil natif **Calculator** (pour pallier les faiblesses du LLM en calcul exact).

#### Instructions Système de l'Agent (System Message) :
```text
Tu es l'assistant commercial d'une entreprise technologique. Tu réponds toujours en français de façon concise et courtoise.
RÈGLE ABSOLUE : Dès qu'une question implique un calcul chiffré, des pourcentages, des remises commerciales ou des taxes, tu DOIS impérativement utiliser ton outil "Calculator" pour garantir un résultat exact au centime près. Ne devine jamais les chiffres par toi-même.
```

---

<!-- slide -->
## Slide 15 : TP 2 — Batterie de Tests en Direct dans le Chat
### Observer la Prise de Décision Autonome de l'Agent

Ouvrez l'onglet **"Chat"** de n8n et testez ces 3 invites :

- **Test 1 (Dialogue ordinaire)** :  
  *"Bonjour, que proposes-tu comme services ?"*  
  &rarr; **Constat :** L'agent répond directement sans solliciter l'outil.
- **Test 2 (Raisonnement avec outil)** :  
  *"Un client commande 18 ordinateurs à 849,90 € HT avec une remise de 12% puis une TVA de 20%. Quel est le montant TTC final ?"*  
  &rarr; **Constat :** L'agent invoque la calculatrice et fournit le résultat exact (**16 147,20 €**).
- **Test 3 (Test de mémoire)** :  
  *"Quel était le prix unitaire de l'ordinateur mentionné juste avant ?"*  
  &rarr; **Constat :** Grâce au buffer, il retrouve immédiatement la valeur (**849,90 €**).

---

<!-- slide -->
## Slide 16 : Les 4 Règles d'Or de l'Automatisation en Production
### Sécurité, Économie & Maîtrise des Risques

1. **Zéro Clé d'API en clair**  
   Ne jamais coder une clé d'API dans un prompt ou un webhook. Toujours utiliser les coffres-forts d'identifiants (*Credentials* sur n8n, *Connections* sur Make).
2. **Prévention des Boucles Infinies**  
   Un bot qui répond automatiquement par email peut boucler avec le répondeur d'absence du destinataire. Filtrer systématiquement les objets contenant `Auto-reply` ou `Out of office`.
3. **Modération des Tokens**  
   Ne pas transmettre un document de 100 pages si 5 lignes suffisent. Tronquer et filtrer en amont pour réduire la facture d'API par 10.
4. **Human-in-the-Loop**  
   Pour les actions sensibles (virement, suppression de compte, email à un client VIP), l'IA prépare le brouillon et un humain valide l'envoi via un bouton.

---

<!-- slide -->
## Slide 17 : Quiz d'Évaluation (Questions 1 à 3)

1. **Quelle est la différence fondamentale entre Polling et Webhook ?**
   - *Réponse :* Le polling vérifie périodiquement s'il y a du nouveau, le webhook est alerté instantanément dès que l'événement survient (temps réel).
2. **Pourquoi intercaler un module "Parse JSON" après l'appel IA dans Make ?**
   - *Réponse :* Pour transformer la chaîne de caractères brute renvoyée par le LLM en variables individuelles exploitables par les filtres et les modules suivants.
3. **Qu'est-ce qui distingue le nœud "AI Agent" de n8n d'un flux classique ?**
   - *Réponse :* Il raisonne de façon autonome et décide lui-même d'invoquer ou non des outils connectés en fonction du besoin.

---

<!-- slide -->
## Slide 18 : Quiz d'Évaluation (Questions 4 & 5) + Mini-Défi

4. **Pourquoi confier le calcul arithmétique à l'outil "Calculator" ?**
   - *Réponse :* Les LLMs sont des modèles probabilistes sujets aux erreurs et hallucinations sur les calculs précis et les arrondis financiers.
5. **Si une entreprise médicale exige que ses données ne quittent jamais ses serveurs internes :**
   - *Réponse :* n8n déployé en On-premise (Docker interne) couplé à un LLM local souverain (ex: Ollama / Mistral).

#### 🚀 Mini-Défi Extension (Pour les plus rapides) :
- **Défi Make** : Ajoutez un filtre sur le sentiment &rarr; si "En colère", envoyez un SMS d'alerte.
- **Défi n8n** : Connectez un 2ᵉ outil (ex: *Wikipedia*) et posez une question croisée (*"Superficie de Lyon + 15%"*).

---

<!-- slide -->
## Slide 19 : Conclusion du Cycle & Perspectives
### De l'Utilisateur de LLM à l'Architecte de Workflows

- **Module 1 (Recherche & Dialogue)** : Vous maîtrisez le prompting sur ChatGPT, Gemini et Perplexity.
- **Module 2 (Génération d'Artefacts)** : Vous concevez des web apps sur Lovable et des slides sur Gamma.
- **Module 3 (Orchestration & Agents)** : Vous automatisez des processus métiers et pilotez des agents autonomes avec Make et n8n.

> **Et demain ?** Découvrez les architectures multi-agents (**CrewAI**, **AutoGen**, **LangGraph**) où plusieurs agents spécialisés collaborent comme une véritable équipe de travail !

---

<!-- slide -->
## Slide 20 : Boîte à Outils & Liens Utiles
### Ressources pour Continuer à Pratiquer

- 📕 **Livret de Cours PDF (5 pages A4)** : `cours_ia_make_n8n/GUIDE_PEDAGOGIQUE_MAKE_N8N.pdf`
- 🌐 **Version Web Interactive** : `cours_ia_make_n8n/GUIDE_PEDAGOGIQUE_MAKE_N8N.html`
- 💻 **Communauté Make** : [make.com/templates](https://www.make.com/en/templates)
- ⚡️ **Hub Workflows n8n** : [n8n.io/workflows](https://n8n.io/workflows)
- 🤖 **Google AI Studio (API Gratuite)** : [aistudio.google.com](https://aistudio.google.com)
