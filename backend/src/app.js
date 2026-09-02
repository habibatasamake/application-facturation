const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");

const { authLimiter } = require("./middlewares/rateLimiter");
const errorMiddleware = require("./middlewares/errorMiddleware");

const authRoutes = require("./routes/auth.routes");
const businessProfileRoutes = require("./routes/businessProfile.routes");
const customerRoutes = require("./routes/customer.routes");
const productRoutes = require("./routes/product.routes");
const invoiceRoutes = require("./routes/invoice.routes");
const dashboardRoutes = require("./routes/dashboard.routes");

const app = express();

// Sécurisation des en-têtes HTTP avec Helmet (en autorisant l'accès aux ressources partagées)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Autoriser les requêtes cross-origin du frontend
app.use(cors());

// Parser le corps des requêtes JSON et URL-encodées
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers téléversés (logos et factures PDF)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Route de diagnostic / santé de l'API
app.get("/", (req, res) => {
  res.json({
    status: "healthy",
    message: "API de facturation opérationnelle et sécurisée",
    timestamp: new Date().toISOString(),
  });
});

// Enregistrement des routes avec protection rate-limiting sur l'authentification
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/business-profile", businessProfileRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Middleware global de capture et formatage des erreurs
app.use(errorMiddleware);

module.exports = app;