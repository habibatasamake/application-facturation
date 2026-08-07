const express = require("express");
const cors = require("cors");

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

module.exports = app;