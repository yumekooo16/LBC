const CategoryModel = require("../models/categories.model");

const CategoryController = {
  async getAllCategories(req, res) {
    try {
      const categories = await CategoryModel.getAllCategories();
      res.status(200).json(categories);
    } catch (error) {
      console.error("Erreur lors de la récupération des catégories :", error.message);
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },
};

module.exports = CategoryController;
