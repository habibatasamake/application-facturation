const rateLimit = require("express-rate-limit");

// Limiteur de requêtes pour protéger les endpoints d'authentification (login / register) contre le bruteforce
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limite à 20 tentatives par IP toutes les 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Trop de tentatives d'authentification. Veuillez réessayer dans 15 minutes.",
  },
});

// Limiteur global pour les requêtes de l'API
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 requêtes par minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Limite de requêtes dépassée. Veuillez ralentir.",
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};
