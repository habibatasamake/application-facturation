const express = require("express"); //importation du framework express pour créer l'application backend
const cors = require("cors"); //importation du middleware cors pour gérer les requêtes cross-origin
const authRoutes = require("./routes/auth.routes"); //importation des routes d'authentification définies dans auth.routes.js


const app = express();

// Autoriser les requêtes venant du frontend
app.use(cors());

// Permettre à Express de lire le JSON envoyé dans les requêtes
app.use(express.json());

// Route de test
app.get("/", (req, res) => {
  res.json({
    message: "API de facturation opérationnelle",
  });
});

app.use("/api/auth", authRoutes); //utilisation des routes d'authentification pour les requêtes commençant par /api/auth

module.exports = app;