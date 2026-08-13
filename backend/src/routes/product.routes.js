const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");

const { createProduct, getProducts, getProductById, updateProduct, deleteProduct } = require("../controllers/product.controller");

const router = express.Router();

// Créer un produit
router.post("/", authMiddleware, createProduct);

// Récupérer tous les produits du commerçant connecté
router.get("/", authMiddleware, getProducts);

// Récupérer un produit par son id
router.get("/:id", authMiddleware, getProductById);

// Modifier un produit
router.put("/:id", authMiddleware, updateProduct);

// Désactiver un produit
router.delete("/:id", authMiddleware, deleteProduct);

module.exports = router;