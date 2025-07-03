/**
 * images.route.js : Définit les routes liées à la gestion des images d'annonces
 *
 * - Récupération des images d'une annonce
 * - (Optionnel) Ajout d'autres routes images
 */
const express = require("express");
const router = express.Router();
const imagesController = require("../controllers/images.controller");

// Récupérer les images d'une annonce par son ID
router.get("/annonces/:id/images", imagesController.getAnnonceImages);

// (Optionnel) Autres routes images à ajouter ici si besoin

module.exports = router;
