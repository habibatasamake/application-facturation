const prisma = require("../config/prisma");

const createBusinessProfile = async (req, res) => {
  try {
    const {
      businessName,
      phone,
      address,
      city,
      country,
      currency,
    } = req.body;

    if (!businessName) {
      return res.status(400).json({
        message: "Le nom du commerce est obligatoire",
      });
    }

    const existingProfile = await prisma.businessProfile.findUnique({
      where: {
        userId: req.user.id,
      },
    });

    if (existingProfile) {
      return res.status(409).json({
        message: "Un profil commerce existe déjà pour cet utilisateur",
      });
    }

    const businessProfile = await prisma.businessProfile.create({
      data: {
        userId: req.user.id,
        businessName,
        phone,
        address,
        city,
        country,
        currency: currency || "FCFA",
      },
    });

    return res.status(201).json({
      message: "Profil commerce créé avec succès",
      businessProfile,
    });
  } catch (error) {
    console.error("Erreur createBusinessProfile :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la création du profil commerce",
    });
  }
};

const getBusinessProfile = async (req, res) => {
  try {
    const businessProfile = await prisma.businessProfile.findUnique({
      where: {
        userId: req.user.id,
      },
    });

    if (!businessProfile) {
      return res.status(404).json({
        message: "Aucun profil commerce trouvé",
      });
    }

    return res.json({
      businessProfile,
    });
  } catch (error) {
    console.error("Erreur getBusinessProfile :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la récupération du profil commerce",
    });
  }
};

const updateBusinessProfile = async (req, res) => {
  try {
    const {
      businessName,
      phone,
      address,
      city,
      country,
      currency,
      logoUrl,
    } = req.body;

    const existingProfile = await prisma.businessProfile.findUnique({
      where: {
        userId: req.user.id,
      },
    });

    if (!existingProfile) {
      return res.status(404).json({
        message: "Aucun profil commerce trouvé à modifier",
      });
    }

    const updatedProfile = await prisma.businessProfile.update({
      where: {
        userId: req.user.id,
      },
      data: {
        businessName,
        phone,
        address,
        city,
        country,
        currency,
        logoUrl,
      },
    });

    return res.json({
      message: "Profil commerce mis à jour avec succès",
      businessProfile: updatedProfile,
    });
  } catch (error) {
    console.error("Erreur updateBusinessProfile :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la mise à jour du profil commerce",
    });
  }
};


module.exports = {
  createBusinessProfile,
  getBusinessProfile,
  updateBusinessProfile,
};