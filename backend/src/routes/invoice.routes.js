const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  previewInvoice,
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoiceShareStatus,
} = require("../controllers/invoice.controller");

const router = express.Router();

router.post("/preview", authMiddleware, previewInvoice);
router.post("/", authMiddleware, createInvoice);
router.get("/", authMiddleware, getInvoices);
router.get("/:id", authMiddleware, getInvoiceById);
router.put("/:id/share-status", authMiddleware, updateInvoiceShareStatus);
module.exports = router;