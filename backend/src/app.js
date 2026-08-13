const express = require("express"); //importation du framework express pour créer l'application backend
const cors = require("cors"); //importation du middleware cors pour gérer les requêtes cross-origin
const path = require("path"); //importation du module path pour gérer les chemins de fichiers
const authRoutes = require("./routes/auth.routes"); //importation des routes d'authentification définies dans auth.routes.js

const businessProfileRoutes = require("./routes/businessProfile.routes"); //importation des routes de profil commerce définies dans businessProfile.routes.js
const customerRoutes = require("./routes/customer.routes"); //importation des routes de gestion des clients définies dans customer.routes.js

const productRoutes = require("./routes/product.routes"); //importation des routes de gestion des produits définies dans product.routes.js

const app = express();

// Autoriser les requêtes venant du frontend
app.use(cors());

// Permettre à Express de lire le JSON envoyé dans les requêtes
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Route de test
app.get("/", (req, res) => {
  res.json({
    message: "API de facturation opérationnelle",
  });
});

app.use("/api/auth", authRoutes); //utilisation des routes d'authentification pour les requêtes commençant par /api/auth

app.use("/api/business-profile", businessProfileRoutes); //utilisation des routes de profil commerce pour les requêtes commençant par /api/business-profile
app.use("/api/customers", customerRoutes); //utilisation des routes de gestion des clients pour les requêtes commençant par /api/customers

app.use("/api/products", productRoutes); //utilisation des routes de gestion des produits pour les requêtes commençant par /api/products

module.exports = app;