/**
 * Service IA Hybride (Google Gemini & OpenAI)
 * Analyse les messages textes et vocaux des commerçants
 * et extrait les intentions de facturation structurées.
 */

// Les clés et le fournisseur sont lus dynamiquement à chaque appel dans les fonctions


/**
 * Construit le prompt système avec le catalogue de la boutique
 */
const buildSystemPrompt = ({ businessName, currency = "FCFA", products = [], customers = [], currentDraft = null }) => {
  const productCatalogList = products
    .slice(0, 100)
    .map((p) => `- ${p.name} (Prix: ${p.unitPrice} ${currency}, Unité: ${p.unit || "unité"})`)
    .join("\n");

  const customerList = customers
    .slice(0, 50)
    .map((c) => `- ${c.name}${c.phone ? ` (${c.phone})` : ""}`)
    .join("\n");

  return `Tu es l'assistant commercial intelligent de la boutique "${businessName || "Commerce"}" au Mali (Warifact).
Ta mission est d'aider le boutiquier à gérer ses factures par WhatsApp, rapidement et sans friction.
Devise locale : ${currency}.

CATALOGUE DES PRODUITS EXISTANTS DANS LA BOUTIQUE :
${productCatalogList || "(Aucun produit enregistré pour le moment)"}

CLIENTS CONNUS :
${customerList || "(Aucun client enregistré)"}

ÉTAT ACTUEL :
${currentDraft ? `Un brouillon de facture est déjà EN COURS : ${JSON.stringify(currentDraft)}` : "Aucun brouillon en cours."}

RÈGLES IMPORTANTES :
1. Comprends le français courant et le bambara, le langage commercial informel et les termes usuels au Mali (ex: "bidon kèlè" = 1 bidon, "sac de 50kg", "remise", "ciment", "riz brisé", etc.).
2. Si le message indique de créer une facture : action = "CREATE_DRAFT".
3. Si un brouillon existe déjà et que le commerçant demande un ajustement (ex: "ajoute 1 sac", "mets 1000f de remise", "change le nom du client") : action = "UPDATE_DRAFT".
4. Si le commerçant confirme (ex: "c'est bon", "valide", "envoie", "génère la facture", "ok valide") : action = "CONFIRM_INVOICE".
5. Si le commerçant veut abandonner (ex: "annule", "laisse tomber", "efface") : action = "CANCEL_DRAFT".
6. Pour toute autre question générale sur la boutique ou salutation : action = "GENERAL_QUERY".
7. Si un produit mentionné correspond à un produit du catalogue ci-dessus, réutilise le nom exact du catalogue.
8. Si le boutiquier n'a pas précisé de prix unitaire pour un produit, laisse unitPrice à null (le système utilisera le prix du catalogue).
9. Ne fais PAS de calcul mathématique complexe : fournis simplement les quantités et prix bruts.
10. Rédige toujours un "friendlyMessage" court, poli et clair, prêt à être envoyé directement sur WhatsApp au commerçant.
11. Extrais également l'unité si elle est précisée ou implicite (ex: "sac", "bidon", "kg", "carton", "paquet", "litre", "boîte", etc.), sinon renvoie "unité".

TU DOIS OBLIGATOIREMENT RÉPONDRE AVEC UN OBJET JSON STRICT RESPECTANT CE FORMAT :
{
  "action": "CREATE_DRAFT" | "UPDATE_DRAFT" | "CONFIRM_INVOICE" | "CANCEL_DRAFT" | "GENERAL_QUERY",
  "customer": {
    "name": "Nom du client ou null",
    "phone": "Numéro de téléphone du client ou null"
  },
  "items": [
    {
      "productName": "Nom de l'article",
      "quantity": 1,
      "unitPrice": 5000 (ou null si non précisé),
      "unit": "sac" (ou "kg", "bidon", "carton", "unité", etc.)
    }
  ],
  "discount": 0 (remise en FCFA, ou null),
  "notes": "Remarque optionnelle ou null",
  "friendlyMessage": "Ton message de réponse au commerçant"
}`;
};

/**
 * Traitement avec l'API Google Gemini
 */
const processWithGemini = async ({ text, audioBuffer, systemPrompt }) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error("GEMINI_API_KEY n'est pas configurée dans les variables d'environnement.");
  }

  const parts = [];

  // Si c'est un message audio, on l'ajoute en inlineData base64 (Multimodal)
  if (audioBuffer) {
    parts.push({
      inlineData: {
        mimeType: "audio/ogg",
        data: audioBuffer.toString("base64"),
      },
    });
    parts.push({
      text: "Voici une note vocale d'un boutiquier malien. Écoute attentivement le message et analyse sa demande selon les instructions système.",
    });
  } else if (text) {
    parts.push({
      text: `Message du boutiquier : "${text}"`,
    });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Erreur Gemini API :", data);
    throw new Error(data.error?.message || "Erreur lors de l'appel à l'API Gemini");
  }

  const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidateText) {
    throw new Error("Réponse vide de Gemini");
  }

  return JSON.parse(candidateText);
};

/**
 * Transcription audio avec OpenAI Whisper
 */
const transcribeWithWhisper = async (audioBuffer) => {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error("OPENAI_API_KEY n'est pas configurée pour la transcription Whisper.");
  }

  const formData = new FormData();
  const audioBlob = new Blob([audioBuffer], { type: "audio/ogg" });
  formData.append("file", audioBlob, "voice_note.ogg");
  formData.append("model", "whisper-1");
  formData.append("language", "fr");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Erreur Whisper :", data);
    throw new Error(data.error?.message || "Erreur de transcription audio");
  }

  return data.text;
};

/**
 * Traitement textuel avec OpenAI GPT-4o
 */
const processWithOpenAI = async ({ text, audioBuffer, systemPrompt }) => {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error("OPENAI_API_KEY n'est pas configurée dans les variables d'environnement.");
  }

  let promptText = text;

  // Si c'est un audio, on transcrit d'abord avec Whisper
  if (audioBuffer) {
    promptText = await transcribeWithWhisper(audioBuffer);
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: promptText || "Bonjour" },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Erreur OpenAI API :", data);
    throw new Error(data.error?.message || "Erreur lors de l'appel à l'API OpenAI");
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Réponse vide d'OpenAI");
  }

  return JSON.parse(content);
};

/**
 * Point d'entrée principal qui sélectionne le bon fournisseur
 */
const analyzeMerchantMessage = async ({
  text,
  audioBuffer,
  businessName,
  currency = "FCFA",
  products = [],
  customers = [],
  currentDraft = null,
  overrideProvider = null,
}) => {
  let provider = (overrideProvider || process.env.AI_PROVIDER || "").toLowerCase();

  // Détection automatique intelligente : si OpenAI est configuré mais pas Gemini, on bascule sur OpenAI
  if (provider === "gemini" && !process.env.GEMINI_API_KEY && process.env.OPENAI_API_KEY) {
    provider = "openai";
  } else if (provider === "openai" && !process.env.OPENAI_API_KEY && process.env.GEMINI_API_KEY) {
    provider = "gemini";
  } else if (!provider) {
    provider = process.env.OPENAI_API_KEY ? "openai" : "gemini";
  }

  const systemPrompt = buildSystemPrompt({
    businessName,
    currency,
    products,
    customers,
    currentDraft,
  });

  if (provider === "openai") {
    return await processWithOpenAI({ text, audioBuffer, systemPrompt });
  }

  // Par défaut : Google Gemini
  return await processWithGemini({ text, audioBuffer, systemPrompt });
};

module.exports = {
  analyzeMerchantMessage,
  buildSystemPrompt,
};
