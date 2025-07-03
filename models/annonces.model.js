const { supabase } = require("../services/supabaseClient");

const TABLE_NAME = "annonces";

/**
 * AnnonceModel : Gère les opérations CRUD sur les annonces via Supabase.
 * - Création, récupération, mise à jour et suppression d'annonces.
 * - Utilise la table "annonces" de la base de données Supabase.
 */
const AnnonceModel = {
  /**
   * Crée une nouvelle annonce dans la base de données.
   * @param {Object} annonceData - Données de la nouvelle annonce.
   * @returns {Object|null} Annonce créée ou null en cas d'erreur.
   */
  async createAnnonce(annonceData) {
    try {
      const { data, error } = await supabase.from(TABLE_NAME).insert(annonceData).select().single();
      if (error) {
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Erreur lors de la création de l'annonce :", error.message);
      return null;
    }
  },

  /**
   * Récupère toutes les annonces avec les informations liées (utilisateur, catégorie, images).
   * @returns {Array} Liste des annonces ou tableau vide en cas d'erreur.
   */
  async getAllAnnonces() {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(
          `
          *,
          users(pseudo, localite, telephone),
          categories(nom),
          images(url, id)
        `
        )
        .order("created_at", { ascending: false });
      if (error) {
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération de toutes les annonces :", error.message);
      return [];
    }
  },

  /**
   * Récupère une annonce par son ID avec les informations liées.
   * @param {string} id - ID de l'annonce.
   * @returns {Object|null} Annonce trouvée ou null.
   */
  async getAnnonceById(id) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(
          `
          *,
          users(pseudo, localite, telephone),
          categories(nom),
          images(url, id) 
        `
        )
        .eq("id", id)
        .single();
      if (error && error.code !== "PGRST116") {
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'annonce par ID :", error.message);
      return null;
    }
  },

  /**
   * Récupère toutes les annonces d'un utilisateur donné.
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Array} Liste des annonces ou tableau vide.
   */
  async getAnnoncesByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(
          `
          *,
          categories(nom),
          images(url)
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) {
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération des annonces par ID utilisateur :", error.message);
      return [];
    }
  },

  /**
   * Met à jour une annonce existante (seulement si l'utilisateur est propriétaire).
   * @param {string} id - ID de l'annonce.
   * @param {Object} updates - Données à mettre à jour.
   * @param {string} userId - ID du propriétaire de l'annonce.
   * @returns {Object|null} Annonce mise à jour ou null.
   */
  async updateAnnonce(id, updates, userId) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) {
        throw error;
      }
      if (!data) {
        console.warn(
          `Tentative de mise à jour de l'annonce ${id} par utilisateur non autorisé ${userId} ou annonce non trouvée.`
        );
        return null;
      }
      return data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'annonce :", error.message);
      return null;
    }
  },

  /**
   * Supprime une annonce (seulement si l'utilisateur est propriétaire).
   * @param {string} id - ID de l'annonce à supprimer.
   * @param {string} userId - ID du propriétaire de l'annonce.
   * @returns {boolean} true si succès, false sinon.
   */
  async deleteAnnonce(id, userId) {
    try {
      const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id).eq("user_id", userId);
      if (error) {
        throw error;
      }
      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression de l'annonce :", error.message);
      return false;
    }
  },
};

module.exports = AnnonceModel;
