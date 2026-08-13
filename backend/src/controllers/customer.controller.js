const prisma = require("../config/prisma");

const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, city, country } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Le nom du client est obligatoire",
      });
    }

    const customer = await prisma.customer.create({
      data: {
        userId: req.user.id,
        name,
        phone,
        email,
        address,
        city,
        country,
      },
    });

    return res.status(201).json({
      message: "Client créé avec succès",
      customer,
    });
  } catch (error) {
    console.error("Erreur createCustomer :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la création du client",
    });
  }
};

const getCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      customers,
    });
  } catch (error) {
    console.error("Erreur getCustomers :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la récupération des clients",
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
      where: {
        id: id,
        userId: req.user.id,
      },
    });

    if (!customer) {
      return res.status(404).json({
        message: "Client introuvable",
      });
    }

    return res.json({
      customer,
    });
  } catch (error) {
    console.error("Erreur getCustomerById :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la récupération du client",
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address, city, country } = req.body;

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: id,
        userId: req.user.id,
      },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        message: "Client introuvable",
      });
    }

    const updatedCustomer = await prisma.customer.update({
      where: {
        id: id,
      },
      data: {
        name,
        phone,
        email,
        address,
        city,
        country,
      },
    });

    return res.json({
      message: "Client mis à jour avec succès",
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error("Erreur updateCustomer :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la modification du client",
    });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: id,
        userId: req.user.id,
      },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        message: "Client introuvable",
      });
    }

    await prisma.customer.delete({
      where: {
        id: id,
      },
    });

    return res.json({
      message: "Client supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur deleteCustomer :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la suppression du client",
    });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
};