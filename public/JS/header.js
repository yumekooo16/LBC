/**
 * header.js : Génère dynamiquement le header de navigation global pour TrouvTout
 *
 * - Navigation entre Annonces, Favoris, Profil, Auth, Déconnexion
 * - Gestion du token pour accès au profil
 * - Affichage d'un message lors de la déconnexion
 */
window.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("mainHeaderNav")) return;
  const header = document.createElement("header");
  header.id = "mainHeaderNav";
  header.className = "main-header-leboncoin";

  // Bouton Accueil/Annonces
  const btnAnnonces = document.createElement("button");
  btnAnnonces.textContent = "Annonces";
  btnAnnonces.className = "header-btn header-btn-orange";
  btnAnnonces.onclick = () => {
    window.location.href = "/annonces.html";
  };

  // Bouton Favoris
  const btnFavoris = document.createElement("button");
  btnFavoris.textContent = "Favoris ★";
  btnFavoris.className = "header-btn header-btn-yellow";
  btnFavoris.onclick = () => {
    window.location.href = "/favoris.html";
  };

  // Bouton Profil
  const btnProfil = document.createElement("button");
  btnProfil.textContent = "Profil";
  btnProfil.className = "header-btn header-btn-outline";
  btnProfil.onclick = () => {
    // On tente de récupérer l'ID utilisateur depuis le token localStorage
    const token = localStorage.getItem("trouvtout_token");
    if (!token) {
      window.location.href = "/auth.html";
      return;
    }
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.user && data.user.id) {
          window.location.href = `/profil.html?id=${data.user.id}`;
        } else {
          window.location.href = "/auth.html";
        }
      })
      .catch(() => (window.location.href = "/auth.html"));
  };

  // Bouton Connexion/Inscription
  const btnAuth = document.createElement("button");
  btnAuth.textContent = "Connexion/Inscription";
  btnAuth.className = "header-btn header-btn-outline";
  btnAuth.onclick = () => {
    window.location.href = "/auth.html";
  };

  // Bouton Déconnexion
  const btnLogout = document.createElement("button");
  btnLogout.textContent = "Se déconnecter";
  btnLogout.className = "header-btn header-btn-red";
  btnLogout.onclick = () => {
    localStorage.removeItem("trouvtout_token");
    // Affiche un message de déconnexion puis redirige
    const msg = document.createElement("div");
    msg.textContent = "Vous avez été déconnecté avec succès.";
    msg.style.position = "fixed";
    msg.style.top = "30px";
    msg.style.left = "50%";
    msg.style.transform = "translateX(-50%)";
    msg.style.background = "#1976d2";
    msg.style.color = "#fff";
    msg.style.padding = "16px 32px";
    msg.style.borderRadius = "8px";
    msg.style.fontSize = "1.1em";
    msg.style.boxShadow = "0 2px 8px #0002";
    msg.style.zIndex = "9999";
    document.body.appendChild(msg);
    setTimeout(() => {
      window.location.href = "/auth.html";
    }, 1200);
  };

  header.appendChild(btnAnnonces);
  header.appendChild(btnFavoris);
  header.appendChild(btnProfil);
  header.appendChild(btnAuth);
  header.appendChild(btnLogout);

  document.body.prepend(header);
});
