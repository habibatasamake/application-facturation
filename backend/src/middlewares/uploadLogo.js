const multer = require("multer");
const path = require("path");

// Définir où et comment sauvegarder le fichier
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/logos");
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);

    cb(null, `logo-${uniqueSuffix}${extension}`);
  },
});

// Vérifier que le fichier est bien une image
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Seules les images JPG, PNG ou WEBP sont autorisées"), false);
  }
};

const uploadLogo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 Mo maximum
  },
});

module.exports = uploadLogo;