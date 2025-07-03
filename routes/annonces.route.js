/**
 * annonces.route.js : Définit les routes liées aux annonces
 *
 * - Récupération, création, modification, suppression d'annonces
 * - Gestion des images d'annonces
 * - Sécurisation par middleware d'authentification et de propriété
 * - Utilise Multer pour l'upload d'images (en mémoire)
 */
const express = require("express");
const router = express.Router();
const AnnonceController = require("../controllers/annonces.controller");
const ImageController = require("../controllers/images.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// Récupérer toutes les annonces
router.get("/", authMiddleware.requireAuth, AnnonceController.getAllAnnonces);

// Récupérer une annonce par son ID
router.get("/:id", authMiddleware.requireAuth, AnnonceController.getAnnonceById);

// Créer une nouvelle annonce (avec upload d'images)
router.post("/", authMiddleware.requireAuth, upload.array("images", 5), AnnonceController.createAnnonce);

// Modifier une annonce (propriétaire uniquement)
router.put("/:id", authMiddleware.requireAuth, authMiddleware.isAnnonceOwner, AnnonceController.updateAnnonce);

// Supprimer une annonce (propriétaire uniquement)
router.delete("/:id", authMiddleware.requireAuth, authMiddleware.isAnnonceOwner, AnnonceController.deleteAnnonce);

// Ajouter une image à une annonce
router.post(
  "/:id/images",
  authMiddleware.requireAuth,
  authMiddleware.isAnnonceOwner,
  upload.single("image"),
  ImageController.uploadAnnonceImage
);

// Récupérer les images d'une annonce
router.get("/:id/images", ImageController.getAnnonceImages);

// Supprimer une image d'une annonce (propriétaire uniquement)
router.delete(
  "/:annonceId/images/:imageId",
  authMiddleware.requireAuth,
  authMiddleware.isAnnonceOwner,
  ImageController.deleteAnnonceImage
);

// Récupérer les annonces de l'utilisateur connecté
router.get("/user/me", authMiddleware.requireAuth, AnnonceController.getAnnoncesByUserId);

module.exports = router;
