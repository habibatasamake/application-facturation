const multer = require("multer");

const errorMiddleware = (err, req, res, next) => {
  // Erreurs liées à Multer (taille du fichier dépassée, type non valide...)
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Le fichier téléversé est trop volumineux (limite max : 2 Mo).",
      });
    }

    return res.status(400).json({
      message: `Erreur d'upload : ${err.message}`,
    });
  }

  // Erreur personnalisée avec message (ex: filtre de fichier invalide)
  if (err.message && err.message.includes("Seules les images")) {
    return res.status(400).json({
      message: err.message,
    });
  }

  // Erreur JSON syntax error (si le client envoie un JSON mal formé)
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      message: "Le format JSON de la requête est invalide.",
    });
  }

  // Erreur avec code de statut personnalisé (ex: throw { status: 404, message: ... })
  if (err.status) {
    return res.status(err.status).json({
      message: err.message || "Une erreur est survenue",
    });
  }

  // Erreur serveur non gérée par défaut
  console.error("Erreur serveur non gérée :", err);
  return res.status(500).json({
    message: "Erreur interne du serveur",
  });
};

module.exports = errorMiddleware;
