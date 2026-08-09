const express = require("express");

const router = express.Router();
const { register, login, getMe } = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/authMiddleware");

// Route d'inscription
router.post("/register", register);

// Route de connexion
router.post("/login", login);

// Route pour récupérer l'utilisateur connecté
router.get("/me", authMiddleware, getMe);

module.exports = router;