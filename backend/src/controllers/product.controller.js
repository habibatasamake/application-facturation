const prisma = require("../config/prisma");

const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      unitPrice,
      unit,
      taxRate,
    } = req.body;

    const price = Number(unitPrice);
    const tax = taxRate === undefined || taxRate === "" ? 0 : Number(taxRate);

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Le nom du produit est obligatoire",
      });
    }

    if (!unit || !unit.trim()) {
      return res.status(400).json({
        message: "L’unité du produit est obligatoire",
      });
    }

    if (!unitPrice || Number.isNaN(price) || price <= 0) {
      return res.status(400).json({
        message: "Le prix unitaire doit être supérieur à 0",
      });
    }

    if (unitPrice === undefined || unitPrice === null || unitPrice === "") {
      return res.status(400).json({
        message: "Le prix unitaire est obligatoire",
      });
    }

    const product = await prisma.product.create({
      data: {
        userId: req.user.id,
        name: name.trim(),
        description,
        unitPrice: price,
        unit: unit.trim(),
        taxRate: tax,
      }
    });

    return res.status(201).json({
      message: "Produit créé avec succès",
      product,
    });
  } catch (error) {
    console.error("Erreur createProduct :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la création du produit",
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        userId: req.user.id,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      products,
    });
  } catch (error) {
    console.error("Erreur getProducts :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la récupération des produits",
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        id: id,
        userId: req.user.id,
        isActive: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        message: "Produit introuvable",
      });
    }

    return res.json({
      product,
    });
  } catch (error) {
    console.error("Erreur getProductById :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la récupération du produit",
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      unitPrice,
      unit,
      taxRate,
    } = req.body;

    const existingProduct = await prisma.product.findFirst({
      where: {
        id: id,
        userId: req.user.id,
        isActive: true,
      },
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: "Produit introuvable",
      });
    }

    const updatedProduct = await prisma.product.update({
      where: {
        id: id,
      },
      data: {
        name,
        description,
        unitPrice: unitPrice !== undefined ? Number(unitPrice) : undefined,
        unit,
        taxRate: taxRate !== undefined && taxRate !== null && taxRate !== ""
          ? Number(taxRate)
          : null,
      },
    });

    return res.json({
      message: "Produit mis à jour avec succès",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Erreur updateProduct :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la modification du produit",
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProduct = await prisma.product.findFirst({
      where: {
        id: id,
        userId: req.user.id,
        isActive: true,
      },
    });

    if (!existingProduct) {
      return res.status(404).json({
        message: "Produit introuvable",
      });
    }

    const deletedProduct = await prisma.product.update({
      where: {
        id: id,
      },
      data: {
        isActive: false,
      },
    });

    return res.json({
      message: "Produit désactivé avec succès",
      product: deletedProduct,
    });
  } catch (error) {
    console.error("Erreur deleteProduct :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la désactivation du produit",
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};