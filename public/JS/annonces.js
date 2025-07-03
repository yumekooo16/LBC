/**
 * annonces.js : Gère la logique des annonces (création, affichage, modification, suppression, favoris)
 *
 * - Affichage de toutes les annonces
 * - Création d'une annonce
 * - Modification et suppression d'annonce (propriétaire)
 * - Ajout aux favoris
 * - Navigation entre pages
 * - Affichage des messages de formulaire
 * - Gestion du token JWT (localStorage)
 */
// ----- AFFICHAGE DE TOUTES LES ANNONCES -----
const getAllAnnoncesButton = document.getElementById("getAllAnnoncesButton");
const allAnnoncesList = document.getElementById("allAnnoncesList");
if (getAllAnnoncesButton && allAnnoncesList) {
  getAllAnnoncesButton.addEventListener("click", async function () {
    allAnnoncesList.innerHTML = "";
    try {
      const res = await fetch(`${API_BASE_URL}/annonces`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });
      const annonces = await res.json();
      if (res.ok && Array.isArray(annonces)) {
        if (annonces.length === 0) {
          allAnnoncesList.innerHTML = "<li>Aucune annonce trouvée.</li>";
        } else {
          annonces.forEach((annonce) => {
            // Filtrage : n'afficher le bouton Favori que si l'ID est un UUID valide
            const isUUID =
              typeof annonce.id === "string" &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(annonce.id);
            const li = document.createElement("li");
            li.style.position = "relative";
            // Affichage des images (max 5)
            let imagesHtml = "";
            if (annonce.images && Array.isArray(annonce.images) && annonce.images.length > 0) {
              imagesHtml =
                `<div class="annonce-images" style="display:flex;gap:8px;margin-bottom:8px;">` +
                annonce.images
                  .slice(0, 5)
                  .map(
                    (img) =>
                      `<img src="${img.url}" alt="Image annonce" style="max-width:80px;max-height:80px;border-radius:6px;border:1px solid #ccc;object-fit:cover;" loading="lazy">`
                  )
                  .join("") +
                `</div>`;
            }
            li.innerHTML = `
              <div style="display:flex;align-items:center;justify-content:space-between;background:#f4f4f4;padding:10px 12px;border-radius:8px;margin-bottom:10px;">
                <div>
                  <strong style="color:#1976d2;font-size:1.1em;">${annonce.titre}</strong><br>
                  <span>Localité : ${annonce.localite}</span><br>
                  <span style="color:#00bfa5; font-weight:bold;">Prix : ${annonce.prix} €</span>
                  ${imagesHtml}
                </div>
                <div style="display:flex;gap:10px;">
                  ${
                    isUUID
                      ? `<button style=\"background:#ffc107;color:#333;padding:6px 16px;border:none;border-radius:5px;cursor:pointer;\" onclick=\"event.stopPropagation();\">Favori</button>`
                      : ""
                  }
                  <button style="background:#1976d2;color:#fff;padding:6px 16px;border:none;border-radius:5px;cursor:pointer;" onclick="event.stopPropagation();">Consulter</button>
                  ${
                    annonce.user_id && getCurrentUserId() === annonce.user_id
                      ? `<button style="background:#dc3545;color:#fff;padding:6px 16px;border:none;border-radius:5px;cursor:pointer;" onclick="event.stopPropagation();">Supprimer</button>`
                      : ""
                  }
                </div>
              </div>
              <div class="annonce-details-container" style="display:none;"></div>
            `;
            // Ajout des listeners sur les boutons (car innerHTML ne garde pas les events)
            const btns = li.querySelectorAll("button");
            let btnIdx = 0;
            if (isUUID) {
              btns[btnIdx++].onclick = () => {
                console.log("[Favoris][Front] ajout favori", annonce.id, typeof annonce.id);
                ajouterAuxFavoris(String(annonce.id));
              };
            }
            btns[btnIdx++].onclick = () => consulterAnnonceDansListe(annonce.id, li);
            if (annonce.user_id && getCurrentUserId() === annonce.user_id) {
              btns[btnIdx++].onclick = () => supprimerAnnonce(annonce.id);
            }
            allAnnoncesList.appendChild(li);
          });

          // Fonction pour ajouter une annonce aux favoris
          async function ajouterAuxFavoris(annonceId) {
            try {
              console.log("[Favoris][Front] fetch POST", {
                url: `${API_BASE_URL}/favoris`,
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${currentToken}`,
                },
                body: { annonce_id: annonceId },
              });
              const res = await fetch(`${API_BASE_URL}/favoris`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${currentToken}`,
                },
                body: JSON.stringify({ annonce_id: annonceId }),
              });
              const result = await res.json();
              console.log("[Favoris][Front] réponse serveur", res.status, result);
              if (res.ok) {
                displayFormMessage("getAllAnnoncesMessage", "Annonce ajoutée aux favoris !", true);
              } else {
                displayFormMessage("getAllAnnoncesMessage", result.message || "Erreur lors de l'ajout aux favoris.", false);
              }
            } catch (error) {
              displayFormMessage("getAllAnnoncesMessage", "Erreur réseau lors de l'ajout aux favoris.", false);
            }
          }

          // Nouvelle fonction : affiche les détails sous l'annonce cliquée
          function consulterAnnonceDansListe(id, li) {
            // Masquer tous les autres détails
            document.querySelectorAll(".annonce-details-container").forEach((div) => (div.style.display = "none"));
            fetch(`${API_BASE_URL}/annonces/${id}`, {
              headers: { Authorization: `Bearer ${currentToken}` },
            })
              .then((res) => res.json())
              .then((annonce) => {
                const detailsDiv = li.querySelector(".annonce-details-container");
                if (annonce && annonce.titre) {
                  let userInfo = "";
                  if (annonce.users) {
                    userInfo = `<p>Pseudo : ${annonce.users.pseudo || ""}</p><p>Téléphone : ${
                      annonce.users.telephone || ""
                    }</p>`;
                  }
                  let modifierBtn = "";
                  if (annonce.user_id && getCurrentUserId() === annonce.user_id) {
                    modifierBtn = `<button id="btnModifierAnnonce_${annonce.id}" style="background:#007bff;color:#fff;padding:6px 16px;border:none;border-radius:5px;cursor:pointer;margin-right:10px;">Modifier</button>`;
                  }
                  // Affichage des images dans les détails
                  let imagesHtml = "";
                  if (annonce.images && Array.isArray(annonce.images) && annonce.images.length > 0) {
                    imagesHtml =
                      `<div class=\"annonce-images\" style=\"display:flex;gap:8px;margin-bottom:8px;\">` +
                      annonce.images
                        .slice(0, 5)
                        .map(
                          (img) =>
                            `<img src=\"${img.url}\" alt=\"Image annonce\" style=\"max-width:120px;max-height:120px;border-radius:6px;border:1px solid #ccc;object-fit:cover;\" loading=\"lazy\">`
                        )
                        .join("") +
                      `</div>`;
                  }
                  detailsDiv.innerHTML = `
                    <div style="background:#fff;border:1px solid #1976d2;padding:16px 20px;margin-top:10px;border-radius:8px;">
                      <h3>${annonce.titre}</h3>
                      <p>${annonce.description}</p>
                      <p>Prix : ${annonce.prix} €</p>
                      <p>Localité : ${annonce.localite}</p>
                      ${imagesHtml}
                      ${userInfo}
                      <div style="margin-top:15px;">${modifierBtn}</div>
                    </div>
                  `;
                  detailsDiv.style.display = "block";
                  if (modifierBtn) {
                    document.getElementById(`btnModifierAnnonce_${annonce.id}`).onclick = function () {
                      afficherFormModification(annonce);
                    };
                  }
                } else {
                  detailsDiv.innerHTML = "<p>Annonce non trouvée.</p>";
                  detailsDiv.style.display = "block";
                }
              })
              .catch(() => {
                const detailsDiv = li.querySelector(".annonce-details-container");
                detailsDiv.innerHTML = "<p>Erreur lors de la consultation.</p>";
                detailsDiv.style.display = "block";
              });
          }
          // Récupère l'ID utilisateur courant à partir du token (décodage JWT simplifié)
          function getCurrentUserId() {
            try {
              const token = currentToken;
              if (!token) return null;
              const payload = JSON.parse(atob(token.split(".")[1]));
              return payload.sub || payload.user_id || payload.id || null;
            } catch {
              return null;
            }
          }

          // Consulter une annonce (affichage simple)
          function consulterAnnonce(id) {
            fetch(`${API_BASE_URL}/annonces/${id}`, {
              headers: { Authorization: `Bearer ${currentToken}` },
            })
              .then((res) => res.json())
              .then((annonce) => {
                const detailsDiv = document.getElementById("annonceDetails");
                if (annonce && annonce.titre) {
                  let userInfo = "";
                  if (annonce.users) {
                    userInfo = `<p>Pseudo : ${annonce.users.pseudo || ""}</p><p>Téléphone : ${
                      annonce.users.telephone || ""
                    }</p>`;
                  }
                  let modifierBtn = "";
                  if (annonce.user_id && getCurrentUserId() === annonce.user_id) {
                    modifierBtn = `<button id="btnModifierAnnonce" style="background:#007bff;color:#fff;padding:6px 16px;border:none;border-radius:5px;cursor:pointer;margin-right:10px;">Modifier</button>`;
                  }
                  detailsDiv.innerHTML = `
                    <h3>${annonce.titre}</h3>
                    <p>${annonce.description}</p>
                    <p>Prix : ${annonce.prix} €</p>
                    <p>Localité : ${annonce.localite}</p>
                    ${userInfo}
                    <div style="margin-top:15px;">${modifierBtn}</div>
                  `;
                  if (modifierBtn) {
                    document.getElementById("btnModifierAnnonce").onclick = function () {
                      afficherFormModification(annonce);
                    };
                  }
                } else {
                  detailsDiv.innerHTML = "<p>Annonce non trouvée.</p>";
                }
              })
              .catch(() => {
                document.getElementById("annonceDetails").innerHTML = "<p>Erreur lors de la consultation.</p>";
              });
          }

          // Afficher le formulaire de modification pré-rempli
          function afficherFormModification(annonce) {
            document.getElementById("updateAnnonceFormContainer").style.display = "block";
            document.getElementById("updateAnnonceHiddenId").value = annonce.id;
            document.getElementById("updateAnnonceTitre").value = annonce.titre;
            document.getElementById("updateAnnonceDescription").value = annonce.description;
            document.getElementById("updateAnnoncePrix").value = annonce.prix;
            document.getElementById("updateAnnonceLocalite").value = annonce.localite;
            document.getElementById("updateAnnonceCategoryId").value = annonce.category_id;
          }

          // Cacher le formulaire de modification
          document.getElementById("cancelUpdateAnnonce").onclick = function () {
            document.getElementById("updateAnnonceFormContainer").style.display = "none";
          };

          // Soumission du formulaire de modification
          const updateAnnonceForm = document.getElementById("updateAnnonceForm");
          if (updateAnnonceForm) {
            updateAnnonceForm.addEventListener("submit", async function (event) {
              event.preventDefault();
              const id = document.getElementById("updateAnnonceHiddenId").value;
              const data = {
                titre: document.getElementById("updateAnnonceTitre").value,
                description: document.getElementById("updateAnnonceDescription").value,
                prix: document.getElementById("updateAnnoncePrix").value,
                localite: document.getElementById("updateAnnonceLocalite").value,
                category_id: document.getElementById("updateAnnonceCategoryId").value,
              };
              try {
                const res = await fetch(`${API_BASE_URL}/annonces/${id}`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${currentToken}`,
                  },
                  body: JSON.stringify(data),
                });
                const result = await res.json();
                displayFormMessage(
                  "updateAnnonceMessage",
                  result.message || (res.ok ? "Annonce modifiée !" : "Erreur modification."),
                  res.ok
                );
                if (res.ok) {
                  document.getElementById("updateAnnonceFormContainer").style.display = "none";
                  getAllAnnoncesButton.click();
                }
              } catch {
                displayFormMessage("updateAnnonceMessage", "Erreur réseau.", false);
              }
            });
          }

          // Suppression d'une annonce avec boîte de dialogue personnalisée Oui/Non
          function supprimerAnnonce(id) {
            const dialog = document.createElement("div");
            dialog.style.position = "fixed";
            dialog.style.top = "0";
            dialog.style.left = "0";
            dialog.style.width = "100vw";
            dialog.style.height = "100vh";
            dialog.style.background = "rgba(0,0,0,0.4)";
            dialog.style.display = "flex";
            dialog.style.alignItems = "center";
            dialog.style.justifyContent = "center";
            dialog.style.zIndex = "9999";
            dialog.innerHTML = `
              <div style="background:#fff;padding:30px 40px;border-radius:10px;box-shadow:0 2px 10px #0003;text-align:center;max-width:90vw;">
                <p style="font-size:1.1em;margin-bottom:20px;">Voulez-vous vraiment supprimer cette annonce ?</p>
                <button id="confirmDeleteAnnonce" style="margin-right:20px;padding:8px 20px;background:#dc3545;color:#fff;border:none;border-radius:5px;">Oui</button>
                <button id="cancelDeleteAnnonce" style="padding:8px 20px;background:#6c757d;color:#fff;border:none;border-radius:5px;">Non</button>
              </div>
            `;
            document.body.appendChild(dialog);
            document.getElementById("confirmDeleteAnnonce").onclick = function () {
              fetch(`${API_BASE_URL}/annonces/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${currentToken}` },
              })
                .then((res) => res.json())
                .then((result) => {
                  displayFormMessage(
                    "getAllAnnoncesMessage",
                    result.message || (result.success ? "Annonce supprimée." : "Erreur suppression."),
                    result.success
                  );
                  getAllAnnoncesButton.click();
                  document.body.removeChild(dialog);
                })
                .catch(() => {
                  displayFormMessage("getAllAnnoncesMessage", "Erreur réseau.", false);
                  document.body.removeChild(dialog);
                });
            };
            document.getElementById("cancelDeleteAnnonce").onclick = function () {
              document.body.removeChild(dialog);
            };
          }
        }
      } else {
        allAnnoncesList.innerHTML = `<li>Erreur lors du chargement des annonces.</li>`;
      }
    } catch (error) {
      allAnnoncesList.innerHTML = `<li>Erreur réseau lors du chargement des annonces.</li>`;
    }
  });
}
// Gestion de la création d'annonce
const createAnnonceForm = document.getElementById("createAnnonceForm");
if (createAnnonceForm) {
  createAnnonceForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const formData = new FormData(createAnnonceForm);
    // Ajoute le token d'auth dans l'en-tête
    try {
      const res = await fetch(`${API_BASE_URL}/annonces`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
        body: formData,
      });
      const result = await res.json();
      displayApiResponse(res.status, result);
      if (res.ok) {
        displayFormMessage("createAnnonceMessage", "Annonce créée avec succès !", true);
        createAnnonceForm.reset();
      } else {
        displayFormMessage("createAnnonceMessage", result.message || "Erreur lors de la création de l'annonce.", false);
      }
    } catch (error) {
      displayApiResponse("N/A", { message: "Erreur réseau", details: error.message });
      displayFormMessage("createAnnonceMessage", "Erreur réseau lors de la création de l'annonce.", false);
    }
  });
}
// annonces.js : gère la logique des annonces, création, affichage, modification, suppression, navigation
const API_BASE_URL = "http://localhost:2203/api";
let currentToken = localStorage.getItem("trouvtout_token") || null;

/**
 * Affiche la réponse de l'API (actuellement désactivé)
 * @param {number|string} status - Code de statut HTTP ou "N/A"
 * @param {Object} data - Données de la réponse
 */
function displayApiResponse(status, data) {
  // Ne rien afficher (peut être personnalisé pour debug)
}

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

// ----- NAVIGATION RETOUR VERS AUTH -----
const gotoAuthBtn = document.getElementById("gotoAuthBtn");
if (gotoAuthBtn) {
  gotoAuthBtn.addEventListener("click", function () {
    window.location.href = "/auth.html";
  });
}

// ----- DÉCONNEXION UTILISATEUR -----
const logoutBtn = document.getElementById("logoutButton");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async function () {
    if (!currentToken) {
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
        setTimeout(() => {
          window.location.href = "/auth.html";
        }, 1000);
      } else {
        displayFormMessage("logoutMessage", result.message || "Erreur lors de la déconnexion.", false);
      }
    } catch (error) {
      displayApiResponse("N/A", { message: "Erreur réseau", details: error.message });
      displayFormMessage("logoutMessage", "Erreur réseau lors de la déconnexion.", false);
    }
  });
}

// --- Code création annonce, affichage, modification, suppression, images ---
// Copie/colle ici tout le JS utile de l'ancien index.html (hors inscription/connexion)
// ...
// Pour la démo, tu peux copier/coller tout le JS de gestion des annonces de ton index.html ici
// (évite de dupliquer la logique d'inscription/connexion)

// --- Coller ici le JS annonces de index.html (hors auth) ---
// ...
// (Pour la suite, tu peux demander à Copilot de coller le JS exact si besoin)
