/**
 * auth.js : Gère l'inscription, la connexion, la déconnexion, la suppression de compte et la navigation vers annonces.html
 *
 * - Inscription utilisateur (formulaire)
 * - Connexion utilisateur (formulaire)
 * - Déconnexion (bouton)
 * - Suppression de compte (bouton)
 * - Navigation vers annonces
 * - Gestion du token JWT (localStorage)
 * - Affichage des messages de formulaire
 */
const API_BASE_URL = "http://localhost:2203/api";
let currentToken = null;

/**
 * Affiche la réponse de l'API (actuellement désactivé)
 * @param {number|string} status - Code de statut HTTP ou "N/A"
 * @param {Object} data - Données de la réponse
 */
function displayApiResponse(status, data) {
  // Ne rien afficher (peut être personnalisé pour debug)
}

/**
 * Affiche un message temporaire sous un formulaire.
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

// ----- INSCRIPTION UTILISATEUR -----
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      displayApiResponse(res.status, result);
      if (res.ok) {
        displayFormMessage("signupMessage", "Inscription réussie ! Vous êtes maintenant connecté(e).", true);
        this.reset();
      } else {
        displayFormMessage("signupMessage", result.message || "Erreur lors de l'inscription.", false);
      }
    } catch (error) {
      displayApiResponse("N/A", { message: "Erreur réseau", details: error.message });
      displayFormMessage("signupMessage", "Erreur réseau lors de l'inscription.", false);
    }
  });
}

// ----- CONNEXION UTILISATEUR -----
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      displayApiResponse(res.status, result);
      if (res.ok && result.session && result.session.access_token) {
        currentToken = result.session.access_token;
        localStorage.setItem("trouvtout_token", currentToken);
        displayFormMessage("loginMessage", "Connexion réussie !", true);
        this.reset();
      } else {
        currentToken = null;
        localStorage.removeItem("trouvtout_token");
        displayFormMessage("loginMessage", result.message || "Échec de la connexion.", false);
      }
    } catch (error) {
      displayApiResponse("N/A", { message: "Erreur réseau", details: error.message });
      displayFormMessage("loginMessage", "Erreur réseau lors de la connexion.", false);
    }
  });
}

// ----- DÉCONNEXION UTILISATEUR -----
const logoutBtn = document.getElementById("logoutButton");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async function () {
    if (!currentToken && !localStorage.getItem("trouvtout_token")) {
      displayFormMessage("logoutMessage", "Vous n'êtes pas connecté(e).", false);
      displayApiResponse(400, { message: "Aucun token de session à déconnecter." });
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/auth/logout`, { method: "POST" });
      const result = await res.json();
      displayApiResponse(res.status, result);
      if (res.ok) {
        currentToken = null;
        localStorage.removeItem("trouvtout_token");
        displayFormMessage("logoutMessage", "Déconnexion réussie !", true);
      } else {
        displayFormMessage("logoutMessage", result.message || "Erreur lors de la déconnexion.", false);
      }
    } catch (error) {
      displayApiResponse("N/A", { message: "Erreur réseau", details: error.message });
      displayFormMessage("logoutMessage", "Erreur réseau lors de la déconnexion.", false);
    }
  });
}

// ----- NAVIGATION VERS ANNONCES -----
const gotoAnnoncesBtn = document.getElementById("gotoAnnoncesBtn");
if (gotoAnnoncesBtn) {
  gotoAnnoncesBtn.addEventListener("click", function () {
    window.location.href = "/annonces.html";
  });
}

// ----- SUPPRESSION DU COMPTE UTILISATEUR -----
const deleteAccountBtn = document.getElementById("deleteAccountButton");
if (deleteAccountBtn) {
  deleteAccountBtn.addEventListener("click", async function () {
    if (!currentToken && !localStorage.getItem("trouvtout_token")) {
      displayFormMessage("logoutMessage", "Vous n'êtes pas connecté(e).", false);
      displayApiResponse(400, { message: "Aucun token de session." });
      return;
    }
    if (!confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
      return;
    }
    try {
      // Récupérer l'ID utilisateur à partir du token JWT
      let token = currentToken || localStorage.getItem("trouvtout_token");
      let userId = null;
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        userId = payload.sub || payload.user_id || payload.id || null;
      } catch (e) {}
      if (!userId) {
        displayFormMessage("logoutMessage", "Impossible de récupérer l'ID utilisateur.", false);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      displayApiResponse(res.status, result);
      if (res.ok) {
        currentToken = null;
        localStorage.removeItem("trouvtout_token");
        displayFormMessage("logoutMessage", "Compte supprimé avec succès.", true);
        setTimeout(() => {
          window.location.href = "/auth.html";
        }, 1500);
      } else {
        displayFormMessage("logoutMessage", result.message || "Erreur lors de la suppression du compte.", false);
      }
    } catch (error) {
      displayApiResponse("N/A", { message: "Erreur réseau", details: error.message });
      displayFormMessage("logoutMessage", "Erreur réseau lors de la suppression du compte.", false);
    }
  });
}

// ----- AUTO-LOGIN SI TOKEN EN LOCALSTORAGE -----
window.addEventListener("DOMContentLoaded", function () {
  const token = localStorage.getItem("trouvtout_token");
  if (token) {
    currentToken = token;
  }
});
