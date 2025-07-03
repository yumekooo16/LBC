const { supabase } = require("../services/supabaseClient");

const TABLE_NAME = "favoris";

const FavoriModel = {
  async addFavori(userId, annonceId) {
    try {
      // Forcer l'ID annonce au bon type (UUID string ou int selon la BDD)
      let annonceIdTyped = annonceId;
      if (typeof annonceId === "number") {
        annonceIdTyped = annonceId.toString();
      }
      // Si la colonne est UUID, il faut une string UUID
      // Si c'est un int, il faut un int
      // Ici, on tente string (UUID) par défaut
      const existingFavori = await supabase
        .from(TABLE_NAME)
        .select("id")
        .eq("user_id", userId)
        .eq("annonce_id", annonceIdTyped)
        .single();

      if (existingFavori.data) {
        console.warn("Cette annonce est déjà en favori pour cet utilisateur.");
        return existingFavori.data;
      }
      if (existingFavori.error && existingFavori.error.code !== "PGRST116") {
        throw existingFavori.error;
      }

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert({ user_id: userId, annonce_id: annonceIdTyped })
        .select()
        .single();

      if (error) {
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Erreur lors de l'ajout aux favoris :", error.message);
      return null;
    }
  },

  async removeFavori(userId, annonceId) {
    try {
      const { error } = await supabase.from(TABLE_NAME).delete().eq("user_id", userId).eq("annonce_id", annonceId);

      if (error) {
        throw error;
      }
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression des favoris :", error.message);
      return false;
    }
  },

  async getFavorisByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(
          `
          annonce_id,
          annonces (
            id, titre, description, prix, localite, created_at,
            categories(nom),
            images(url)
          )
        `
        )
        .eq("user_id", userId);

      if (error) {
        throw error;
      }
      // On renvoie un objet avec l'id UUID de l'annonce pour chaque favori
      return data
        .map((favori) => {
          if (!favori.annonces) return null;
          return {
            id: favori.annonce_id, // UUID pour la suppression
            ...favori.annonces,
          };
        })
        .filter(Boolean);
    } catch (error) {
      console.error("Erreur lors de la récupération des favoris de l'utilisateur :", error.message);
      return [];
    }
  },

  async isFavori(userId, annonceId) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("id")
        .eq("user_id", userId)
        .eq("annonce_id", annonceId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }
      return !!data;
    } catch (error) {
      console.error("Erreur lors de la vérification des favoris :", error.message);
      return false;
    }
  },
};

module.exports = FavoriModel;
