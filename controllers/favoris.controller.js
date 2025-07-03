const FavoriModel = require("../models/favoris.model");

const FavoriController = {
  async addFavori(req, res) {
    try {
      /**
       * Log de debug pour l'ajout d'un favori
       */
      console.log("[Favoris] Body reçu:", req.body);
      console.log("[Favoris] Headers:", req.headers);
      console.log("[Favoris] Utilisateur:", req.user);

      if (!req.body || Object.keys(req.body).length === 0) {
        console.error("[Favoris] Body vide ou non parsé !");
        return res.status(400).json({ message: "Body vide ou mal formé. Vérifiez le Content-Type et le format JSON." });
      }

      const { annonce_id } = req.body;
      const userId = req.user && req.user.id;

      if (!annonce_id) {
        console.error("[Favoris] annonce_id manquant dans le body ! Body:", req.body);
        return res.status(400).json({ message: "L'ID de l'annonce est requis." });
      }
      /**
       * Vérification du format UUID (v1 à v5) pour l'annonce
       */
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (typeof annonce_id !== "string" || !uuidRegex.test(annonce_id)) {
        console.error("[Favoris] annonce_id n'est pas un UUID valide:", annonce_id);
        return res.status(400).json({ message: "L'ID de l'annonce est invalide (UUID attendu)." });
      }

      if (!userId) {
        console.error("[Favoris] Utilisateur non authentifié ! req.user:", req.user);
        return res.status(401).json({ message: "Utilisateur non authentifié." });
      }

      const existingFavori = await FavoriModel.isFavori(userId, annonce_id);
      if (existingFavori) {
        return res.status(409).json({ message: "Cette annonce est déjà dans vos favoris." });
      }

      const favori = await FavoriModel.addFavori(userId, annonce_id);

      if (!favori) {
        return res.status(500).json({ message: "Erreur lors de l'ajout aux favoris. L'annonce pourrait ne pas exister." });
      }

      res.status(201).json({ message: "Annonce ajoutée aux favoris.", favori });
    } catch (error) {
      console.error("Erreur lors de l'ajout aux favoris :", error.message, error);
      res.status(500).json({ message: "Erreur interne du serveur lors de l'ajout aux favoris." });
    }
  },

  async removeFavori(req, res) {
    try {
      const annonceId = req.params.id;
      const userId = req.user.id;

      if (!annonceId) {
        return res.status(400).json({ message: "L'ID de l'annonce à retirer des favoris est requis." });
      }
      /**
       * Vérification du format UUID (v4) pour la suppression d'un favori
       */
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (typeof annonceId !== "string" || !uuidRegex.test(annonceId)) {
        return res.status(400).json({ message: "L'ID de l'annonce est invalide (UUID attendu)." });
      }

      const success = await FavoriModel.removeFavori(userId, annonceId);

      if (!success) {
        return res.status(404).json({ message: "Favori non trouvé pour cet utilisateur ou impossible à supprimer." });
      }

      res.status(200).json({ message: "Annonce retirée des favoris avec succès." });
    } catch (error) {
      console.error("Erreur lors de la suppression des favoris :", error.message);
      res.status(500).json({ message: "Erreur interne du serveur lors de la suppression des favoris." });
    }
  },

  async getUserFavoris(req, res) {
    try {
      const userId = req.params.id;

      if (!userId) {
        return res.status(400).json({ message: "L'ID utilisateur est requis." });
      }

      if (req.user.id !== userId) {
        return res
          .status(403)
          .json({ message: "Accès interdit. Vous ne pouvez pas voir les favoris d'un autre utilisateur." });
      }

      const favoris = await FavoriModel.getFavorisByUserId(userId);
      res.status(200).json(favoris);
    } catch (error) {
      console.error("Erreur lors de la récupération des favoris de l'utilisateur :", error.message);
      res.status(500).json({ message: "Erreur interne du serveur lors de la récupération des favoris." });
    }
  },
};

module.exports = FavoriController;
