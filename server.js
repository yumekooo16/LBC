require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth.route");
const userRoutes = require("./routes/users.route");
const annonceRoutes = require("./routes/annonces.route");
const categoryRoutes = require("./routes/categories.route");

const favoriRoutes = require("./routes/favoris.route");
const imagesRoutes = require("./routes/images.route");

const app = express();
const PORT = process.env.PORT || 2203;

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/annonces", annonceRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/favoris", favoriRoutes);
app.use("/api", imagesRoutes); // Ajout des routes images (dont /annonces/:id/images)

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((req, res, next) => {
  res.status(404).json({ message: "Route non trouvée. Veuillez vérifier l'URL et la méthode HTTP." });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Erreur serveur interne. Veuillez réessayer plus tard.",
    error: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Serveur TrouvTout démarré sur le port ${PORT}`);
  console.log(`Accédez à l'interface HTML via http://localhost:${PORT}`);
});
