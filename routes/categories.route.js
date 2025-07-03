/**
 * categories.route.js : Définit la route de récupération des catégories
 *
 * - Récupération de toutes les catégories
 */
const express = require("express");
const router = express.Router();
const CategoryController = require("../controllers/categories.controller");

// Récupérer toutes les catégories
router.get("/", CategoryController.getAllCategories);

module.exports = router;
