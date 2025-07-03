const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { supabase, supabaseAdmin, jwtSecret } = require("../services/supabaseClient");
const UserModel = require("../models/users.model");

const AuthController = {
  async signup(req, res) {
    const { email, password, pseudo, prenom, nom, telephone, localite } = req.body;

    if (!email || !password || !pseudo) {
      return res.status(400).json({ message: "Email, mot de passe et pseudo sont requis." });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: "Format d'email invalide." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères." });
    }

    if (pseudo.length < 3 || pseudo.length > 50) {
      return res.status(400).json({ message: "Le pseudo doit contenir entre 3 et 50 caractères." });
    }

    if (telephone && !/^\d{10,15}$/.test(telephone)) {
      return res
        .status(400)
        .json({ message: "Format de numéro de téléphone invalide. Doit être composé de 10 à 15 chiffres." });
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            pseudo: pseudo,
            prenom: prenom,
            nom: nom,
            telephone: telephone,
            localite: localite,
          },
        },
      });

      if (authError) {
        console.error("Erreur Supabase Auth lors de l'inscription :", authError.message);
        /**
         * Gestion multilingue de l'erreur utilisateur déjà inscrit (Supabase).
         */
        const msg = authError.message.toLowerCase();
        if (
          msg.includes("utilisateur déjà enregistré") ||
          msg.includes("user already registered") ||
          msg.includes("user already exists")
        ) {
          return res.status(409).json({ message: "Cet email est déjà enregistré." });
        }
        return res.status(500).json({ message: "Erreur lors de l'inscription de l'utilisateur." });
      }

      const userId = authData.user.id;

      const newUserDetails = {
        id: userId,
        email: email,
        pseudo: pseudo,
        prenom: prenom || null,
        nom: nom || null,
        telephone: telephone || null,
        localite: localite || null,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      };

      const createdUserInDb = await UserModel.createUser(newUserDetails);

      if (!createdUserInDb) {
        const { error: deleteAuthUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteAuthUserError) {
          console.error(
            "Erreur Supabase Auth lors du rollback de la suppression de l'utilisateur:",
            deleteAuthUserError.message
          );
        }
        console.error("Erreur lors de l'enregistrement des détails utilisateur après inscription Supabase Auth.");
        return res.status(500).json({ message: "Erreur lors de l'enregistrement des détails de l'utilisateur." });
      }

      res.status(201).json({
        message: "Utilisateur inscrit avec succès ! Un email de confirmation pourrait être envoyé.",
        user: {
          id: createdUserInDb.id,
          email: createdUserInDb.email,
          pseudo: createdUserInDb.pseudo,
          localite: createdUserInDb.localite,
        },
        session: authData.session,
      });
    } catch (error) {
      console.error("Erreur interne lors de l'inscription :", error.message);
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },

  async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe sont requis." });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: "Format d'email invalide." });
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) {
        console.error("Erreur Supabase Auth lors de la connexion :", authError.message);

        if (authError.message.includes("Invalid login credentials") || authError.message.includes("Email not confirmed")) {
          return res.status(401).json({ message: "Email non confirmé ou mot de passe incorrect." });
        }
        return res.status(500).json({ message: "Erreur lors de la connexion." });
      }

      const user = authData.user;
      const session = authData.session;

      await UserModel.updateLastActive(user.id);

      const userDetails = await UserModel.getUserById(user.id);

      if (!userDetails) {
        console.warn("Détails utilisateur non trouvés dans la base de données pour l'ID :", user.id);
        return res.status(404).json({ message: "Détails utilisateur non trouvés. Veuillez contacter l'administrateur." });
      }

      res.status(200).json({
        message: "Connexion réussie !",
        user: {
          id: user.id,
          email: user.email,

          pseudo: userDetails.pseudo,
          prenom: userDetails.prenom,
          nom: userDetails.nom,
          telephone: userDetails.telephone,
          localite: userDetails.localite,
        },
        session: session,
      });
    } catch (error) {
      console.error("Erreur interne lors de la connexion :", error.message);
      res.status(500).json({ message: "Erreur interne du serveur lors de la connexion." });
    }
  },

  async logout(req, res) {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Erreur Supabase Auth lors de la déconnexion :", error.message);
        return res.status(500).json({ message: "Erreur lors de la déconnexion." });
      }

      res.status(200).json({ message: "Déconnexion réussie." });
    } catch (error) {
      console.error("Erreur interne lors de la déconnexion :", error.message);
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },

  generateCustomTokenExample(req, res) {
    try {
      if (!jwtSecret) {
        return res.status(500).json({ message: "JWT_SECRET non configurée." });
      }
      const payload = {
        userId: req.user.id,
        role: "admin",
      };
      const token = jwt.sign(payload, jwtSecret, { expiresIn: "1h" });
      res.status(200).json({ customToken: token });
    } catch (error) {
      console.error("Erreur lors de la génération du token personnalisé :", error.message);
      res.status(500).json({ message: "Erreur serveur." });
    }
  },
};

module.exports = AuthController;
