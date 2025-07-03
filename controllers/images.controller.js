// Contrôleur images à compléter
const ImageModel = require("../models/images.model");
const AnnonceModel = require("../models/annonces.model");

const ImageController = {
  async uploadAnnonceImage(req, res) {
    try {
      const annonceId = req.params.id;
      const userId = req.user.id;

      const annonce = await AnnonceModel.getAnnonceById(annonceId);
      if (!annonce) {
        return res.status(404).json({ message: "Annonce non trouvée." });
      }
      if (annonce.user_id !== userId) {
        return res.status(403).json({ message: "Accès interdit. Vous n'êtes pas le propriétaire de cette annonce." });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Aucun fichier image n'a été fourni." });
      }

      const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res
          .status(400)
          .json({ message: "Type de fichier non supporté. Seules les images JPEG, PNG, GIF, WEBP sont autorisées." });
      }
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (req.file.size > MAX_FILE_SIZE) {
        return res.status(400).json({
          message: `Fichier trop volumineux. La taille maximale autorisée est ${MAX_FILE_SIZE / (1024 * 1024)} Mo.`,
        });
      }

      const uploadedImage = await ImageModel.uploadImage(req.file.buffer, req.file.mimetype, annonceId);

      if (!uploadedImage) {
        return res.status(500).json({
          message: "Erreur lors du téléchargement de l'image vers Supabase Storage ou enregistrement en base de données.",
        });
      }

      res.status(201).json({ message: "Image téléchargée avec succès !", image: uploadedImage });
    } catch (error) {
      console.error("Erreur lors du téléchargement de l'image pour l'annonce :", error.message);
      res.status(500).json({ message: "Erreur interne du serveur lors du téléchargement d'image." });
    }
  },

  async getAnnonceImages(req, res) {
    try {
      const annonceId = req.params.id;
      const images = await ImageModel.getImagesByAnnonceId(annonceId);

      if (!images || images.length === 0) {
        return res.status(200).json([]);
      }

      res.status(200).json(images);
    } catch (error) {
      console.error("Erreur lors de la récupération des images de l'annonce :", error.message);
      res.status(500).json({ message: "Erreur interne du serveur lors de la récupération des images." });
    }
  },

  async deleteAnnonceImage(req, res) {
    try {
      const annonceId = req.params.annonceId;
      const imageId = req.params.imageId;

      const success = await ImageModel.deleteImage(imageId, annonceId);

      if (!success) {
        return res.status(500).json({ message: "Impossible de supprimer l'image ou image non trouvée pour cette annonce." });
      }

      res.status(200).json({ message: "Image supprimée avec succès !" });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'image de l'annonce :", error.message);
      res.status(500).json({ message: "Erreur interne du serveur lors de la suppression d'image." });
    }
  },
};

module.exports = ImageController;
