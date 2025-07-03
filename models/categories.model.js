const { supabase } = require("../services/supabaseClient");

const TABLE_NAME = "categories";

const CategoryModel = {
  async getAllCategories() {
    try {
      const { data, error } = await supabase.from(TABLE_NAME).select("*").order("nom", { ascending: true });

      if (error) {
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération des catégories :", error.message);
      return [];
    }
  },

  async findCategoryById(id) {
    try {
      const { data, error } = await supabase.from(TABLE_NAME).select("*").eq("id", id).single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }
      return data;
    } catch (error) {
      console.error("Erreur lors de la recherche de catégorie par ID :", error.message);
      return null;
    }
  },
};

module.exports = CategoryModel;
