const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { createCustomer,  getCustomers, getCustomerById, updateCustomer, deleteCustomer} = require("../controllers/customer.controller");
const router = express.Router();

// Créer un client
router.post("/", authMiddleware, createCustomer);

// Récupérer tous les clients du commerçant connecté
router.get("/", authMiddleware, getCustomers);

// Récupérer un client par son id
router.get("/:id", authMiddleware, getCustomerById);

// Modifier un client
router.put("/:id", authMiddleware, updateCustomer);

// Supprimer un client
router.delete("/:id", authMiddleware, (req, res) => {
  res.json({
    message: "Route suppression client prête",
    customerId: req.params.id,
    user: req.user,
  });
});

module.exports = router;