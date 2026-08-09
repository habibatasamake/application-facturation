const jwt = require("jsonwebtoken");

// Middleware pour vérifier le token JWT dans les requêtes entrantes
// Si le token est valide, on ajoute les informations de l'utilisateur à la requête et on passe au middleware suivant
// Si le token est invalide ou manquant, on renvoie une erreur 401 (Unauthorized)
// Cela permet de protéger certaines routes et de s'assurer que seules les requêtes authentifiées peuvent y accéder(utlisateur connecté)
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Token manquant",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Format du token invalide",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token invalide ou expiré",
    });
  }
};

module.exports = authMiddleware;