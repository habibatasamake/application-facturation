const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  previewInvoice,
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoiceShareStatus,
  updateInvoicePaymentStatus,
  convertQuoteToInvoice,
} = require("../controllers/invoice.controller");

const router = express.Router();

router.post("/preview", authMiddleware, previewInvoice);
router.post("/", authMiddleware, createInvoice);
router.get("/", authMiddleware, getInvoices);
router.get("/:id", authMiddleware, getInvoiceById);

// Mise à jour du statut de partage (WhatsApp / Email)
router.patch("/:id/share-status", authMiddleware, updateInvoiceShareStatus);
router.put("/:id/share-status", authMiddleware, updateInvoiceShareStatus);

// Mise à jour du statut de paiement (PAID, ISSUED, CANCELED)
router.patch("/:id/payment-status", authMiddleware, updateInvoicePaymentStatus);
router.put("/:id/payment-status", authMiddleware, updateInvoicePaymentStatus);

// Conversion d'un devis (QUOTE) en facture (INVOICE)
router.post("/:id/convert", authMiddleware, convertQuoteToInvoice);

module.exports = router;