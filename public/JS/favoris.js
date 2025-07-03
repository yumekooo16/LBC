/**
 * favoris.js : Gère l'affichage, l'ajout et la suppression des favoris utilisateur
 *
 * - Affichage des favoris de l'utilisateur connecté
 * - Suppression d'un favori
 * - Navigation entre pages principales
 * - Affichage de messages de formulaire
 * - Header dynamique avec navigation
 */
const API_BASE_URL = "http://localhost:2203/api";
let currentToken = localStorage.getItem("trouvtout_token") || null;

/**
 * Affiche un message temporaire sous un formulaire ou une action.
 * @param {string} elementId - ID de l'élément message
 * @param {string} message - Message à afficher
 * @param {boolean} isSuccess - true pour succès, false pour erreur
 */
function displayFormMessage(elementId, message, isSuccess) {
  const messageElement = document.getElementById(elementId);
  messageElement.textContent = message;
  messageElement.className = `form-message ${isSuccess ? "success" : "error"}`;
  setTimeout(() => {
    messageElement.textContent = "";
    messageElement.className = "form-message";
  }, 5000);
}

const gotoAnnoncesBtn = document.getElementById("gotoAnnoncesBtn");
if (gotoAnnoncesBtn) {
  gotoAnnoncesBtn.addEventListener("click", function () {
    window.location.href = "/annonces.html";
  });
}

const logoutBtn = document.getElementById("logoutButton");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async function () {
    if (!currentToken) {
      displayFormMessage("logoutMessage", "Vous n'êtes pas connecté(e).", false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/auth/logout`, { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        currentToken = null;
        localStorage.removeItem("trouvtout_token");
        displayFormMessage("logoutMessage", "Déconnexion réussie !", true);
        setTimeout(() => {
          window.location.href = "/auth.html";
        }, 1000);
      } else {
        displayFormMessage("logoutMessage", result.message || "Erreur lors de la déconnexion.", false);
      }
    } catch (error) {
      displayFormMessage("logoutMessage", "Erreur réseau lors de la déconnexion.", false);
    }
  });
}

// ----- AFFICHAGE DES FAVORIS DE L'UTILISATEUR CONNECTÉ -----
/**
 * Charge et affiche la liste des favoris de l'utilisateur connecté.
 */
async function chargerFavoris() {
  const favorisList = document.getElementById("favorisList");
  favorisList.innerHTML = "";
  try {
    // On récupère l'ID utilisateur à partir du token
    const token = currentToken;
    let userId = null;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        userId = payload.sub || payload.user_id || payload.id || null;
      } catch {}
    }
    if (!userId) {
      favorisList.innerHTML = "<li>Utilisateur non authentifié.</li>";
      return;
    }
    const res = await fetch(`${API_BASE_URL}/favoris/user/${userId}`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    const favoris = await res.json();
    if (res.ok && Array.isArray(favoris)) {
      if (favoris.length === 0) {
        favorisList.innerHTML = "<li>Aucun favori pour le moment.</li>";
      } else {
        favoris.forEach((annonce) => {
          const li = document.createElement("li");
          li.innerHTML = `
            <div style=\"display:flex;align-items:center;justify-content:space-between;background:#f4f4f4;padding:10px 12px;border-radius:8px;margin-bottom:10px;\">
              <div>
                <strong style=\"color:#1976d2;font-size:1.1em;\">${annonce.titre}</strong><br>
                <span>Localité : ${annonce.localite}</span>
              </div>
              <button style=\"background:#dc3545;color:#fff;padding:6px 16px;border:none;border-radius:5px;cursor:pointer;\" onclick=\"event.stopPropagation();\">Retirer</button>
            </div>
          `;
          li.querySelector("button").onclick = () => retirerDesFavoris(annonce.id);
          favorisList.appendChild(li);
        });
      }
    } else {
      favorisList.innerHTML = "<li>Erreur lors du chargement des favoris.</li>";
    }
  } catch (error) {
    favorisList.innerHTML = "<li>Erreur réseau lors du chargement des favoris.</li>";
  }
}

/**
 * Retire une annonce des favoris de l'utilisateur.
 * @param {string} annonceId - ID de l'annonce à retirer
 */
async function retirerDesFavoris(annonceId) {
  try {
    const res = await fetch(`${API_BASE_URL}/favoris/${annonceId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    const result = await res.json();
    if (res.ok) {
      displayFormMessage("favorisMessage", "Annonce retirée des favoris.", true);
      chargerFavoris();
    } else {
      displayFormMessage("favorisMessage", result.message || "Erreur lors du retrait.", false);
    }
  } catch (error) {
    displayFormMessage("favorisMessage", "Erreur réseau lors du retrait.", false);
  }
}

// ----- HEADER DE NAVIGATION GLOBAL -----
window.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("mainHeaderNav")) return;
  const header = document.createElement("header");
  header.id = "mainHeaderNav";
  header.style.width = "100%";
  header.style.background = "#f8f9fa";
  header.style.boxShadow = "0 2px 8px #0001";
  header.style.padding = "18px 0 14px 0";
  header.style.marginBottom = "32px";
  header.style.display = "flex";
  header.style.justifyContent = "center";
  header.style.alignItems = "center";
  header.style.gap = "24px";

  // Bouton Accueil/Annonces
  const btnAnnonces = document.createElement("button");
  btnAnnonces.textContent = "Annonces";
  btnAnnonces.style.background = "#1976d2";
  btnAnnonces.style.color = "#fff";
  btnAnnonces.style.border = "none";
  btnAnnonces.style.borderRadius = "6px";
  btnAnnonces.style.padding = "10px 22px";
  btnAnnonces.style.fontSize = "1em";
  btnAnnonces.style.cursor = "pointer";
  btnAnnonces.onclick = () => {
    window.location.href = "/annonces.html";
  };

  // Bouton Favoris
  const btnFavoris = document.createElement("button");
  btnFavoris.textContent = "Favoris ★";
  btnFavoris.style.background = "#ffc107";
  btnFavoris.style.color = "#333";
  btnFavoris.style.border = "none";
  btnFavoris.style.borderRadius = "6px";
  btnFavoris.style.padding = "10px 22px";
  btnFavoris.style.fontSize = "1em";
  btnFavoris.style.fontWeight = "bold";
  btnFavoris.style.cursor = "pointer";
  btnFavoris.onclick = () => {
    window.location.href = "/favoris.html";
  };

  // Bouton Connexion/Inscription
  const btnAuth = document.createElement("button");
  btnAuth.textContent = "Connexion/Inscription";
  btnAuth.style.background = "#fff";
  btnAuth.style.color = "#1976d2";
  btnAuth.style.border = "1.5px solid #1976d2";
  btnAuth.style.borderRadius = "6px";
  btnAuth.style.padding = "10px 22px";
  btnAuth.style.fontSize = "1em";
  btnAuth.style.cursor = "pointer";
  btnAuth.onclick = () => {
    window.location.href = "/auth.html";
  };

  // Bouton Déconnexion
  const btnLogout = document.createElement("button");
  btnLogout.textContent = "Se déconnecter";
  btnLogout.style.background = "#dc3545";
  btnLogout.style.color = "#fff";
  btnLogout.style.border = "none";
  btnLogout.style.borderRadius = "6px";
  btnLogout.style.padding = "10px 22px";
  btnLogout.style.fontSize = "1em";
  btnLogout.style.cursor = "pointer";
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
  header.appendChild(btnAuth);
  header.appendChild(btnLogout);

  document.body.prepend(header);
});

// ----- CHARGEMENT DES FAVORIS AU DÉMARRAGE -----
document.addEventListener("DOMContentLoaded", chargerFavoris);
