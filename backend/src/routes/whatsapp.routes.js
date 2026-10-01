const express = require("express");
const {
  handleWebhookVerification,
  handleIncomingWebhook,
} = require("../controllers/whatsapp.controller");

const router = express.Router();

/**
 * Route GET : Handshake de vérification Meta WhatsApp
 * Meta appelle cette URL lors de la configuration du Webhook
 */
router.get("/webhook", handleWebhookVerification);

/**
 * Route POST : Réception des messages WhatsApp (texte, audio, etc.)
 */
router.post("/webhook", handleIncomingWebhook);

module.exports = router;
