const { supabase } = require("../services/supabaseClient");
const AnnonceModel = require("../models/annonces.model");

const authMiddleware = {
  async requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Vous devez être connecté pour voir les annonces." });
    }

    const token = authHeader.split(" ")[1];

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(token);

      if (authError || !user) {
        console.warn("Erreur de validation du token Supabase ou utilisateur non trouvé :", authError?.message);
        return res.status(401).json({ message: "Vous devez être connecté pour voir les annonces." });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Erreur inattendue lors de la vérification du token :", error.message);
      res.status(500).json({ message: "Erreur interne du serveur lors de l'authentification." });
    }
  },

  isOwner(resourceIdParam) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(403).json({ message: "Accès interdit. Non authentifié." });
      }

      const requestedResourceId = req.params[resourceIdParam];
      const authenticatedUserId = req.user.id;

      if (requestedResourceId !== authenticatedUserId) {
        return res.status(403).json({ message: "Accès interdit. Vous n'êtes pas le propriétaire de cette ressource." });
      }

      next();
    };
  },

  async isAnnonceOwner(req, res, next) {
    if (!req.user) {
      return res.status(403).json({ message: "Accès interdit. Non authentifié." });
    }

    const annonceId = req.params.id || req.params.annonceId;
    if (!annonceId) {
      return res.status(400).json({ message: "ID de l'annonce manquant." });
    }

    try {
      const annonce = await AnnonceModel.getAnnonceById(annonceId);

      if (!annonce) {
        return res.status(404).json({ message: "Annonce non trouvée." });
      }

      if (annonce.user_id !== req.user.id) {
        return res.status(403).json({ message: "Accès interdit. Vous n'êtes pas le propriétaire de cette annonce." });
      }

      next();
    } catch (error) {
      console.error("Erreur lors de la vérification de la propriété de l'annonce :", error.message);
      res.status(500).json({ message: "Erreur interne du serveur lors de la vérification des droits." });
    }
  },
};

module.exports = authMiddleware;
