const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

const { createBusinessProfile, getBusinessProfile, updateBusinessProfile } = require("../controllers/businessProfile.controller");

// Créer le profil commerce
router.post("/", authMiddleware, createBusinessProfile);

// Récupérer le profil commerce
router.get("/", authMiddleware, getBusinessProfile);

// Modifier le profil commerce
router.put("/", authMiddleware, updateBusinessProfile);

module.exports = router;