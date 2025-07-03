/**
 * auth.route.js : Définit les routes d'authentification et de gestion du profil utilisateur
 *
 * - Inscription, connexion, déconnexion
 * - Récupération du profil de l'utilisateur connecté
 * - Sécurisation par middleware d'authentification
 */
const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Inscription utilisateur
router.post("/signup", AuthController.signup);
// Connexion utilisateur
router.post("/login", AuthController.login);
// Déconnexion utilisateur
router.post("/logout", AuthController.logout);

// Récupérer le profil de l'utilisateur connecté
router.get("/me", authMiddleware.requireAuth, async (req, res) => {
  try {
    const user = await require("../models/users.model").getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }
    res.status(200).json({
      user: {
        id: user.id,
        pseudo: user.pseudo,
        localite: user.localite,
        telephone: user.telephone,
        email: user.email,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        last_active: user.last_active,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération du profil.", error: err.message });
  }
});

module.exports = router;
