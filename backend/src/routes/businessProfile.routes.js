const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const uploadLogo = require("../middlewares/uploadLogo");

const router = express.Router();

const { createBusinessProfile, getBusinessProfile, updateBusinessProfile, uploadBusinessLogo} = require("../controllers/businessProfile.controller");

// Créer le profil commerce
router.post("/", authMiddleware, createBusinessProfile);

// Récupérer le profil commerce
router.get("/", authMiddleware, getBusinessProfile);

// Modifier le profil commerce
router.put("/", authMiddleware, updateBusinessProfile);

// Télécharger le logo du commerce
router.post("/logo", authMiddleware, uploadLogo.single("logo"), uploadBusinessLogo);

module.exports = router;