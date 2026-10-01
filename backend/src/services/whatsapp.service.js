const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v21.0";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

/**
 * Envoie un message texte à un numéro WhatsApp
 * @param {string} to - Numéro de téléphone au format international (ex: 22376123456)
 * @param {string} text - Contenu du message
 */
const sendTextMessage = async (to, text) => {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_TOKEN) {
    console.warn(" WhatsApp non configuré : WHATSAPP_PHONE_NUMBER_ID ou WHATSAPP_TOKEN manquant");
    return { mock: true, success: false, reason: "NOT_CONFIGURED" };
  }

  const cleanTo = String(to).replace(/[^0-9]/g, "");

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "text",
        text: {
          preview_url: false,
          body: text,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Erreur sendTextMessage WhatsApp API :", data);
      throw new Error(data.error?.message || "Erreur lors de l'envoi du message WhatsApp");
    }

    return data;
  } catch (error) {
    console.error("Exception sendTextMessage :", error);
    throw error;
  }
};

/**
 * Envoie un document (ex: Facture PDF) à un numéro WhatsApp
 * @param {string} to - Numéro de téléphone
 * @param {string} documentUrl - URL publique accessible du document PDF
 * @param {string} filename - Nom du fichier affiché (ex: Facture_FAC-2026-0001.pdf)
 * @param {string} caption - Texte d'accompagnement
 */
const sendDocumentMessage = async (to, documentUrl, filename, caption = "") => {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_TOKEN) {
    console.warn(" WhatsApp non configuré pour l'envoi de document");
    return { mock: true, success: false, reason: "NOT_CONFIGURED" };
  }

  const cleanTo = String(to).replace(/[^0-9]/g, "");

  try {
    const response = await fetch(`${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "document",
        document: {
          link: documentUrl,
          caption: caption,
          filename: filename,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Erreur sendDocumentMessage WhatsApp API :", data);
      throw new Error(data.error?.message || "Erreur lors de l'envoi du document WhatsApp");
    }

    return data;
  } catch (error) {
    console.error("Exception sendDocumentMessage :", error);
    throw error;
  }
};

/**
 * Récupère l'URL d'un fichier média (audio, image, etc.) depuis Meta
 * @param {string} mediaId - ID du média fourni dans le webhook
 * @returns {Promise<{ url: string, mime_type: string }>}
 */
const getMediaMetadata = async (mediaId) => {
  const response = await fetch(`${WHATSAPP_API_URL}/${mediaId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Erreur getMediaMetadata :", data);
    throw new Error(data.error?.message || "Impossible de récupérer les métadonnées du média");
  }

  return data;
};

/**
 * Télécharge le contenu binaire d'un média (ex: audio ogg)
 * @param {string} mediaUrl - URL obtenue via getMediaMetadata
 * @returns {Promise<Buffer>}
 */
const downloadMediaBinary = async (mediaUrl) => {
  const response = await fetch(mediaUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur lors du téléchargement du média (${response.status})`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

module.exports = {
  sendTextMessage,
  sendDocumentMessage,
  getMediaMetadata,
  downloadMediaBinary,
};
