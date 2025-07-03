/**
 * favoris.route.js : Définit les routes liées aux favoris utilisateur
 *
 * - Ajout et suppression de favoris
 * - Récupération des favoris d'un utilisateur
 * - Sécurisation par middleware d'authentification et de propriété
 */
const express = require("express");
const router = express.Router();
const FavoriController = require("../controllers/favoris.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Ajouter une annonce aux favoris
router.post("/", authMiddleware.requireAuth, FavoriController.addFavori);
// Retirer une annonce des favoris
router.delete("/:id", authMiddleware.requireAuth, FavoriController.removeFavori);
// Récupérer les favoris d'un utilisateur
router.get("/user/:id", authMiddleware.requireAuth, authMiddleware.isOwner("id"), FavoriController.getUserFavoris);

module.exports = router;
