const UserModel = require("../models/users.model");
const AnnonceModel = require("../models/annonces.model");
const { supabase } = require("../services/supabaseClient");

const UserController = {
  async getUserProfile(req, res) {
    try {
      const user = await UserModel.findUserById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé." });
      }
      const publicProfile = {
        id: user.id,
        pseudo: user.pseudo,
        localite: user.localite,
        telephone: user.telephone || null,
        avatar_url: user.avatar_url || null,
        created_at: user.created_at,
        last_active: user.last_active,
      };
      res.status(200).json(publicProfile);
    } catch (error) {
      console.error("Erreur lors de la récupération du profil utilisateur :", error.message);
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },

  async updateProfile(req, res) {
    try {
      const userId = req.params.id;
      const updates = req.body;

      delete updates.id;
      delete updates.email;
      delete updates.password;

      delete updates.created_at;
      delete updates.last_active;

      if (updates.pseudo !== undefined) {
        if (updates.pseudo === null || updates.pseudo.trim() === "") {
          return res.status(400).json({ message: "Le pseudo ne peut pas être vide." });
        }
        if (updates.pseudo.length < 3 || updates.pseudo.length > 50) {
          return res.status(400).json({ message: "Le pseudo doit contenir entre 3 et 50 caractères." });
        }
      }
      if (updates.telephone !== undefined) {
        if (updates.telephone !== null && !/^\d{10,15}$/.test(updates.telephone)) {
          return res.status(400).json({
            message: "Format de numéro de téléphone invalide. Doit être composé de 10 à 15 chiffres ou être null.",
          });
        }
      }
      if (updates.prenom !== undefined) {
        if (updates.prenom !== null && (updates.prenom.length < 2 || updates.prenom.length > 50)) {
          return res.status(400).json({ message: "Le prénom doit contenir entre 2 et 50 caractères ou être null." });
        }
      }
      if (updates.nom !== undefined) {
        if (updates.nom !== null && (updates.nom.length < 2 || updates.nom.length > 50)) {
          return res.status(400).json({ message: "Le nom doit contenir entre 2 et 50 caractères ou être null." });
        }
      }
      if (updates.localite !== undefined) {
        if (updates.localite !== null && (updates.localite.length < 3 || updates.localite.length > 100)) {
          return res.status(400).json({ message: "La localité doit contenir entre 3 et 100 caractères ou être null." });
        }
      }

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

          prenom: updatedUser.prenom,
          nom: updatedUser.nom,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil utilisateur :", error.message);
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },

  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      /**
       * Étape 1 : Supprimer tous les favoris de l'utilisateur dans la base de données
       */
      const { supabase } = require("../services/supabaseClient");
      const { error: favError } = await supabase.from("favoris").delete().eq("user_id", userId);
      if (favError) {
        console.error("Erreur lors de la suppression des favoris de l'utilisateur :", favError.message);
      }

      /**
       * Étape 2 : Supprimer toutes les annonces de l'utilisateur et leurs images associées
       */
      const AnnonceModel = require("../models/annonces.model");
      const ImageModel = require("../models/images.model");
      const userAnnonces = await AnnonceModel.getAnnoncesByUserId(userId);
      for (const annonce of userAnnonces) {
        /**
         * Suppression des images associées à chaque annonce de l'utilisateur
         */
        const images = await ImageModel.getImagesByAnnonceId(annonce.id);
        for (const image of images) {
          await ImageModel.deleteImage(image.id, annonce.id);
        }
        await AnnonceModel.deleteAnnonce(annonce.id, userId);
      }

      /**
       * Étape 3 : Supprimer l'utilisateur de la base de données
       */
      const success = await UserModel.deleteUser(userId);
      if (!success) {
        return res.status(500).json({ message: "Impossible de supprimer le compte utilisateur de la base de données." });
      }

      /**
       * Étape 4 : Supprimer l'utilisateur côté Auth Supabase (authentification)
       */
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        console.error("Erreur Supabase Auth lors de la suppression de l'utilisateur :", authDeleteError.message);
      }

      await supabase.auth.signOut();

      res.status(200).json({ message: "Compte utilisateur, annonces, images et favoris supprimés avec succès." });
    } catch (error) {
      console.error("Erreur lors de la suppression du compte utilisateur :", error.message);
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },
};

module.exports = UserController;
