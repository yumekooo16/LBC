const AnnonceModel = require("../models/annonces.model");
const ImageModel = require("../models/images.model");

const AnnonceController = {
  /**
   * Récupère toutes les annonces d'un utilisateur connecté.
   * @param {Object} req - Requête Express contenant l'utilisateur authentifié.
   * @param {Object} res - Réponse Express.
   */
  async getAnnoncesByUserId(req, res) {
    try {
      const userId = req.user.id;
      const annonces = await AnnonceModel.getAnnoncesByUserId(userId);
      res.status(200).json(annonces);
    } catch (error) {
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },
  async createAnnonce(req, res) {
    try {
      const { titre, description, prix, localite, category_id } = req.body;
      const userId = req.user.id;

      // Récupère les fichiers images envoyés via Multer (upload.array)
      const images = req.files;

      // Vérification des champs obligatoires et validation des entrées

      if (!titre || !description || !prix || !localite || !category_id) {
        return res
          .status(400)
          .json({ message: "Tous les champs obligatoires (titre, description, prix, localité, catégorie) sont requis." });
      }

      if (typeof titre !== "string" || titre.length < 5 || titre.length > 100) {
        return res.status(400).json({ message: "Le titre doit être une chaîne de caractères entre 5 et 100 caractères." });
      }

      if (typeof description !== "string" || description.length < 10 || description.length > 1000) {
        return res
          .status(400)
          .json({ message: "La description doit être une chaîne de caractères entre 10 et 1000 caractères." });
      }

      const parsedPrix = parseFloat(prix);
      if (isNaN(parsedPrix) || parsedPrix <= 0) {
        return res.status(400).json({ message: "Le prix doit être un nombre positif." });
      }

      const parsedCategoryId = parseInt(category_id, 10);
      if (isNaN(parsedCategoryId) || parsedCategoryId <= 0) {
        return res.status(400).json({ message: "L'ID de catégorie est invalide." });
      }

      if (typeof localite !== "string" || localite.length < 3 || localite.length > 100) {
        return res
          .status(400)
          .json({ message: "La localité doit être une chaîne de caractères entre 3 et 100 caractères." });
      }

      if (images && images.length > 0) {
        const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        // Taille maximale autorisée pour une image : 5 Mo
        const MAX_FILE_SIZE = 5 * 1024 * 1024;

        for (const file of images) {
          if (!allowedMimeTypes.includes(file.mimetype)) {
            return res.status(400).json({
              message: `Type de fichier non supporté pour l'image ${file.originalname}. Seules les images JPEG, PNG, GIF, WEBP sont autorisées.`,
            });
          }
          if (file.size > MAX_FILE_SIZE) {
            return res.status(400).json({
              message: `Fichier trop volumineux pour l'image ${file.originalname}. La taille maximale autorisée est ${
                MAX_FILE_SIZE / (1024 * 1024)
              } Mo.`,
            });
          }
        }
      }

      const newAnnonceData = {
        titre,
        description,
        prix: parsedPrix,
        localite,
        user_id: userId,
        category_id: parsedCategoryId,
        created_at: new Date().toISOString(),
      };

      const createdAnnonce = await AnnonceModel.createAnnonce(newAnnonceData);

      if (!createdAnnonce) {
        return res.status(500).json({ message: "Erreur lors de la création de l'annonce dans la base de données." });
      }

      let uploadedImages = [];
      if (images && images.length > 0) {
        for (const file of images) {
          try {
            console.log("[DEBUG] Tentative upload image:", file.originalname, file.mimetype, file.size);
            const img = await ImageModel.uploadImage(file.buffer, file.mimetype, createdAnnonce.id);
            if (img && img.url) {
              uploadedImages.push({ url: img.url, id: img.id });
              console.log("[DEBUG] Image insérée en base:", img);
            } else {
              console.error("[ERREUR UPLOAD IMAGE]", file.originalname, img);
            }
          } catch (err) {
            console.error("[ERREUR uploadImage]", file.originalname, err);
          }
        }
      }

      /**
       * Ajoute le tableau d'images uploadées à la réponse pour cohérence avec la consultation d'annonce.
       */
      res.status(201).json({
        message: "Annonce créée avec succès !",
        annonce: createdAnnonce,
        images: uploadedImages,
      });
    } catch (error) {
      console.error("Erreur lors de la création de l'annonce :", error.message);
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },

  async getAllAnnonces(req, res) {
    try {
      const annonces = await AnnonceModel.getAllAnnonces();
      res.status(200).json(annonces);
    } catch (error) {
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },

  async getAnnonceById(req, res) {
    try {
      const annonce = await AnnonceModel.getAnnonceById(req.params.id);
      if (!annonce) {
        return res.status(404).json({ message: "Annonce non trouvée." });
      }
      res.status(200).json(annonce);
    } catch (error) {
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },

  async updateAnnonce(req, res) {
    try {
      const annonceId = req.params.id;
      const userId = req.user.id;
      const updates = req.body;

      delete updates.id;
      delete updates.user_id;
      delete updates.created_at;

      if (updates.titre !== undefined) {
        if (typeof updates.titre !== "string" || updates.titre.length < 5 || updates.titre.length > 100) {
          return res.status(400).json({ message: "Le titre doit être une chaîne de caractères entre 5 et 100 caractères." });
        }
      }
      if (updates.description !== undefined) {
        if (
          typeof updates.description !== "string" ||
          updates.description.length < 10 ||
          updates.description.length > 1000
        ) {
          return res
            .status(400)
            .json({ message: "La description doit être une chaîne de caractères entre 10 et 1000 caractères." });
        }
      }
      if (updates.prix !== undefined) {
        const parsedPrix = parseFloat(updates.prix);
        if (isNaN(parsedPrix) || parsedPrix <= 0) {
          return res.status(400).json({ message: "Le prix doit être un nombre positif." });
        }
        updates.prix = parsedPrix;
      }
      if (updates.category_id !== undefined) {
        const parsedCategoryId = parseInt(updates.category_id, 10);
        if (isNaN(parsedCategoryId) || parsedCategoryId <= 0) {
          return res.status(400).json({ message: "L'ID de catégorie est invalide." });
        }
        updates.category_id = parsedCategoryId;
      }
      if (updates.localite !== undefined) {
        if (typeof updates.localite !== "string" || updates.localite.length < 3 || updates.localite.length > 100) {
          return res
            .status(400)
            .json({ message: "La localité doit être une chaîne de caractères entre 3 et 100 caractères." });
        }
      }

      const updatedAnnonce = await AnnonceModel.updateAnnonce(annonceId, updates, userId);

      if (!updatedAnnonce) {
        return res
          .status(400)
          .json({ message: "Impossible de mettre à jour l'annonce, vérifiez l'ID ou les données fournies." });
      }

      res.status(200).json({ message: "Annonce mise à jour avec succès !", annonce: updatedAnnonce });
    } catch (error) {
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },

  async deleteAnnonce(req, res) {
    try {
      const annonceId = req.params.id;
      const userId = req.user.id;

      const images = await ImageModel.getImagesByAnnonceId(annonceId);

      for (const image of images) {
        await ImageModel.deleteImage(image.id, annonceId);
      }

      const success = await AnnonceModel.deleteAnnonce(annonceId, userId);

      if (!success) {
        return res.status(500).json({ message: "Impossible de supprimer l'annonce de la base de données." });
      }

      res.status(200).json({ message: "Annonce et images associées supprimées avec succès." });
    } catch (error) {
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },
};

module.exports = AnnonceController;
