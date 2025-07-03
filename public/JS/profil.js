/**
 * profil.js : Affiche le profil de l'utilisateur connecté et ses annonces
 *
 * - Récupère et affiche les infos du profil utilisateur
 * - Récupère et affiche les annonces publiées par l'utilisateur
 * - Permet la modification et la suppression d'annonces
 * - Affiche les messages d'erreur ou d'état
 */

async function chargerProfilConnecte() {
  const profilLoading = document.getElementById("profilLoading");
  const profilInfo = document.getElementById("profilInfo");
  const profilError = document.getElementById("profilError");
  const mesAnnoncesSection = document.getElementById("mesAnnoncesSection");
  const mesAnnoncesList = document.getElementById("mesAnnoncesList");

  const token = localStorage.getItem("trouvtout_token");
  if (!token) {
    profilLoading.style.display = "none";
    profilError.style.display = "block";
    profilError.textContent = "Vous devez être connecté pour voir votre profil.";
    return;
  }

  try {
    // Récupération du profil utilisateur
    const response = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error("Impossible de récupérer le profil utilisateur.");
    }
    const data = await response.json();
    const user = data.user;
    profilLoading.style.display = "none";
    profilInfo.style.display = "block";
    document.getElementById("profilPseudo").textContent = user.pseudo || "-";
    document.getElementById("profilLocalite").textContent = user.localite || "-";
    document.getElementById("profilTelephone").textContent = user.telephone || "-";

    // Récupération des annonces de l'utilisateur
    const annoncesRes = await fetch("/api/annonces/user/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!annoncesRes.ok) {
      throw new Error("Impossible de récupérer vos annonces.");
    }
    const annonces = await annoncesRes.json();
    if (annonces.length > 0) {
      mesAnnoncesSection.style.display = "block";
      mesAnnoncesList.innerHTML = annonces
        .map(
          (a) => `
        <div class="annonce-profil" style="border:1px solid #eee; border-radius:8px; margin:15px 0; padding:15px; background:#fafbfc; position:relative;">
          <h4 style="margin:0 0 8px 0; color:#1976d2;">${a.titre}</h4>
          <div style="color:#444; margin-bottom:2px;">
            <span>Localité : ${a.localite}</span>
            <span style="margin-left:18px; color:#00bfa5; font-weight:bold;">${a.prix} €</span>
          </div>
          <div><strong>Catégorie :</strong> ${a.categories ? a.categories.nom : "-"}</div>
          <div><strong>Description :</strong> ${a.description}</div>
          ${
            a.images && a.images.length > 0
              ? `<img src="${a.images[0].url}" alt="Image annonce" style="max-width:120px; margin-top:8px; border-radius:4px;">`
              : ""
          }
          <div style="margin-top:10px; text-align:right;">
            <button class="btn-edit-annonce" data-id="${
              a.id
            }" style="margin-right:8px; background:#1976d2; color:#fff; border:none; border-radius:4px; padding:5px 12px; cursor:pointer;">Modifier</button>
            <button class="btn-delete-annonce" data-id="${
              a.id
            }" style="background:#e53935; color:#fff; border:none; border-radius:4px; padding:5px 12px; cursor:pointer;">Supprimer</button>
          </div>
        </div>
      `
        )
        .join("");

      // Ajout des listeners pour les boutons Modifier/Supprimer
      document.querySelectorAll(".btn-delete-annonce").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const id = btn.getAttribute("data-id");
          if (confirm("Voulez-vous vraiment supprimer cette annonce ?")) {
            try {
              const delRes = await fetch(`/api/annonces/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              if (!delRes.ok) throw new Error("Erreur lors de la suppression");
              btn.closest(".annonce-profil").remove();
            } catch (err) {
              alert("Suppression impossible : " + (err.message || "Erreur inconnue"));
            }
          }
        });
      });

      document.querySelectorAll(".btn-edit-annonce").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const id = btn.getAttribute("data-id");
          // Récupère les infos de l'annonce à modifier
          const annonce = annonces.find((a) => a.id == id);
          if (!annonce) return;

          // Récupère les catégories pour le select
          let categories = [];
          try {
            const catRes = await fetch("/api/categories");
            if (catRes.ok) categories = await catRes.json();
          } catch {}

          // Crée le formulaire inline
          const formHtml = `
            <form class="form-edit-annonce" data-id="${id}" style="margin-top:15px;background:#f7f7f7;padding:15px;border-radius:8px;">
              <div><label>Titre :</label><input type="text" name="titre" value="${annonce.titre
                .replace(/&/g, "&amp;")
                .replace(/"/g, "&quot;")}" required /></div>
              <div><label>Description :</label><textarea name="description" rows="2" required>${annonce.description.replace(
                /</g,
                "&lt;"
              )}</textarea></div>
              <div><label>Prix :</label><input type="number" name="prix" value="${
                annonce.prix
              }" step="0.01" required /></div>
              <div><label>Localité :</label><input type="text" name="localite" value="${annonce.localite
                .replace(/&/g, "&amp;")
                .replace(/"/g, "&quot;")}" required /></div>
              <div><label>Catégorie :</label>
                <select name="category_id" required>
                  ${categories
                    .map(
                      (cat) =>
                        `<option value="${cat.id}" ${annonce.category_id == cat.id ? "selected" : ""}>${cat.nom}</option>`
                    )
                    .join("")}
                </select>
              </div>
              <div style="margin-top:10px;text-align:right;">
                <button type="submit" style="background:#00bfa5;color:#fff;border:none;border-radius:4px;padding:6px 16px;">Enregistrer</button>
                <button type="button" class="btn-cancel-edit" style="margin-left:8px;background:#eee;color:#444;border:none;border-radius:4px;padding:6px 16px;">Annuler</button>
              </div>
              <div class="form-message-edit" style="margin-top:8px;"></div>
            </form>`;

          // Remplace le bloc annonce par le formulaire
          const annonceDiv = btn.closest(".annonce-profil");
          annonceDiv.innerHTML = formHtml;

          // Listener Annuler
          annonceDiv.querySelector(".btn-cancel-edit").onclick = () => chargerProfilConnecte();

          // Listener submit
          annonceDiv.querySelector("form").onsubmit = async (ev) => {
            ev.preventDefault();
            const form = ev.target;
            const data = {
              titre: form.titre.value,
              description: form.description.value,
              prix: form.prix.value,
              localite: form.localite.value,
              category_id: form.category_id.value,
            };
            try {
              const res = await fetch(`/api/annonces/${id}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
              });
              const result = await res.json();
              const msg = annonceDiv.querySelector(".form-message-edit");
              if (res.ok) {
                msg.textContent = "Annonce modifiée !";
                msg.style.color = "#00bfa5";
                setTimeout(() => chargerProfilConnecte(), 900);
              } else {
                msg.textContent = result.message || "Erreur lors de la modification.";
                msg.style.color = "#e53935";
              }
            } catch {
              const msg = annonceDiv.querySelector(".form-message-edit");
              msg.textContent = "Erreur réseau.";
              msg.style.color = "#e53935";
            }
          };
        });
      });
    } else {
      mesAnnoncesSection.style.display = "block";
      mesAnnoncesList.innerHTML = '<div style="text-align:center;color:#888;">Aucune annonce publiée.</div>';
    }
  } catch (err) {
    profilLoading.style.display = "none";
    profilError.style.display = "block";
    profilError.textContent = err.message || "Erreur lors du chargement du profil.";
  }
}

document.addEventListener("DOMContentLoaded", chargerProfilConnecte);
