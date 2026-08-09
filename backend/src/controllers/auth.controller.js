const bcrypt = require("bcrypt");
const prisma = require("../config/prisma");

const jwt = require("jsonwebtoken");

// Fonction pour gérer l'inscription d'un utilisateur --> si l'utilisateur existe déjà, on renvoie une erreur, sinon on crée un nouvel utilisateur avec le mot de passe hashé
const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    // Vérification que tous les champs sont présents
    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: "Le nom complet, l'email et le mot de passe sont obligatoires",
      });
    }
    // Vérification que l'utilisateur n'existe pas déjà dans la base de données
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    // Si l'utilisateur existe déjà, on renvoie une erreur 409 (Conflict) avec un message approprié
    if (existingUser) {
      return res.status(409).json({
        message: "Un compte existe déjà avec cet email",
      });
    }
    // Hashage du mot de passe avec bcrypt avant de le stocker dans la base de données
    const passwordHash = await bcrypt.hash(password, 10);
    // Création du nouvel utilisateur dans la base de données avec Prisma
    const user = await prisma.user.create({
      data: {
        fullName: fullName,
        email: email,
        passwordHash: passwordHash,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
      },
    });
    return res.status(201).json({
      message: "Compte créé avec succès",
      user: user,
    });
  } catch (error) {
    console.error("Erreur register :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de l'inscription",
    });
  }
};

// Fonction pour gérer la connexion d'un utilisateur --> si l'utilisateur n'existe pas ou si le mot de passe est incorrect, on renvoie une erreur, sinon on génère un token JWT pour l'utilisateur
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "L'email et le mot de passe sont obligatoires",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Identifiants incorrects",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Identifiants incorrects",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.json({
      message: "Connexion réussie",
      token: token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Erreur login :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la connexion",
    });
  }
};

// Fonction pour récupérer les informations de l'utilisateur connecté --> on utilise le middleware d'authentification pour vérifier le token JWT et récupérer l'ID de l'utilisateur
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable",
      });
    }

    return res.json({
      user,
    });
  } catch (error) {
    console.error("Erreur getMe :", error);

    return res.status(500).json({
      message: "Erreur serveur lors de la récupération de l'utilisateur",
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
};