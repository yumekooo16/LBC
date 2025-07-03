const { supabase } = require("../services/supabaseClient");

const TABLE_NAME = "users";

/**
 * UserModel : Gère les opérations CRUD sur les utilisateurs via Supabase.
 * - Création, récupération, mise à jour et suppression d'utilisateur.
 * - Utilise la table "users" de la base de données Supabase.
 */
const UserModel = {
  /**
   * Crée un nouvel utilisateur dans la base de données.
   * @param {Object} userData - Données du nouvel utilisateur.
   * @returns {Object|null} Utilisateur créé ou null en cas d'erreur.
   */
  async createUser(userData) {
    try {
      const { data, error } = await supabase.from(TABLE_NAME).insert([userData]).select().single();
      if (error) {
        console.error("Erreur Supabase lors de la création de l'utilisateur :", error.message);
        return null;
      }
      return data;
    } catch (error) {
      console.error("Erreur inattendue lors de la création de l'utilisateur :", error.message);
      return null;
    }
  },

  /**
   * Récupère un utilisateur par son ID.
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Object|null} Utilisateur trouvé ou null.
   */
  async getUserById(userId) {
    try {
      const { data, error } = await supabase.from(TABLE_NAME).select("*").eq("id", userId).single();
      if (error && error.code !== "PGRST116") {
        console.error(`Erreur Supabase lors de la récupération de l'utilisateur avec l'ID ${userId}:`, error.message);
        return null;
      }
      return data;
    } catch (error) {
      console.error(`Erreur inattendue lors de la récupération de l'utilisateur avec l'ID ${userId}:`, error.message);
      return null;
    }
  },

  /**
   * Met à jour la date de dernière activité de l'utilisateur.
   * @param {string} userId - ID de l'utilisateur.
   * @returns {Object|null} Utilisateur mis à jour ou null.
   */
  async updateLastActive(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({ last_active: new Date().toISOString() })
        .eq("id", userId)
        .select()
        .single();
      if (error) {
        console.error("Erreur Supabase lors de la mise à jour de last_active :", error.message);
        return null;
      }
      return data;
    } catch (error) {
      console.error("Erreur inattendue lors de la mise à jour de last_active :", error.message);
      return null;
    }
  },

  /**
   * Supprime un utilisateur de la base de données.
   * @param {string} userId - ID de l'utilisateur à supprimer.
   * @returns {boolean} true si succès, false sinon.
   */
  async deleteUser(userId) {
    try {
      const { error } = await supabase.from(TABLE_NAME).delete().eq("id", userId);
      if (error) {
        console.error("Erreur Supabase lors de la suppression de l'utilisateur :", error.message);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Erreur inattendue lors de la suppression de l'utilisateur :", error.message);
      return false;
    }
  },
};

module.exports = UserModel;
