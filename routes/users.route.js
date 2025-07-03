/**
 * users.route.js : Définit les routes liées à la gestion des utilisateurs
 *
 * - Récupération, modification, suppression de profil utilisateur
 * - Suppression en cascade des annonces lors de la suppression d'un utilisateur
 * - Récupération des favoris d'un utilisateur
 * - Sécurisation par middleware d'authentification et de propriété
 */
const express = require("express");
const router = express.Router();
const UserModel = require("../models/users.model");
const AnnonceModel = require("../models/annonces.model");
const FavoriController = require("../controllers/favoris.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const { supabase } = require("../services/supabaseClient");

// Récupérer le profil public d'un utilisateur par son ID
router.get("/:id", async (req, res) => {
  try {
    const user = await UserModel.findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    const publicProfile = {
      id: user.id,
      pseudo: user.pseudo,
      localite: user.localite,
      telephone: user.telephone,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      last_active: user.last_active,
    };
    res.status(200).json(publicProfile);
  } catch (error) {
    console.error("Erreur lors de la récupération du profil utilisateur :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
});

// Modifier le profil d'un utilisateur (lui-même uniquement)
router.put("/:id", authMiddleware.requireAuth, authMiddleware.isOwner("id"), async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    delete updates.id;
    delete updates.email;
    delete updates.password;

    const updatedUser = await UserModel.updateUser(userId, updates);

    if (!updatedUser) {
      return res.status(400).json({ message: "Impossible de mettre à jour le profil." });
    }

    res.status(200).json({
      message: "Profil mis à jour avec succès.",
      user: {
        id: updatedUser.id,
        pseudo: updatedUser.pseudo,
        localite: updatedUser.localite,
        telephone: updatedUser.telephone,
        avatar_url: updatedUser.avatar_url,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil utilisateur :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
});

// Supprimer un utilisateur (lui-même uniquement, supprime aussi ses annonces)
router.delete("/:id", authMiddleware.requireAuth, authMiddleware.isOwner("id"), async (req, res) => {
  try {
    const userId = req.params.id;

    const userAnnonces = await AnnonceModel.getAnnoncesByUserId(userId);
    for (const annonce of userAnnonces) {
      await AnnonceModel.deleteAnnonce(annonce.id, userId);
    }

    const success = await UserModel.deleteUser(userId);

    if (!success) {
      return res.status(500).json({ message: "Impossible de supprimer le compte utilisateur." });
    }

    await supabase.auth.signOut();

    res.status(200).json({ message: "Compte utilisateur et annonces associées supprimés avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression du compte utilisateur :", error.message);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
});

// Récupérer les favoris d'un utilisateur (lui-même uniquement)
router.get("/:id/favoris", authMiddleware.requireAuth, authMiddleware.isOwner("id"), FavoriController.getUserFavoris);

module.exports = router;
