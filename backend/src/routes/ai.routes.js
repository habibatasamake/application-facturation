const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middlewares/authMiddleware");
const { parseInvoicePrompt } = require("../controllers/ai.controller");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Max 10 Mo
});

const router = express.Router();

// POST /api/ai/parse-invoice
// Supporte à la fois { prompt: "..." } en JSON et un upload audio optionnel 'audio'
router.post(
  "/parse-invoice",
  authMiddleware,
  upload.single("audio"),
  parseInvoicePrompt
);

module.exports = router;
