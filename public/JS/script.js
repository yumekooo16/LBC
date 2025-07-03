/**
 * script.js : Gère la redirection automatique si l'utilisateur n'est pas connecté
 *
 * - Redirige vers la page de connexion si le token n'est pas présent
 * - S'applique à toutes les pages sauf celles listées dans publicPages
 */
// Redirection automatique si non connecté (hors pages auth)
const publicPages = ["/auth.html", "/auth", "/auth/", "/index.html", "/"]; // pages accessibles sans connexion
const currentPath = window.location.pathname;
if (!publicPages.includes(currentPath)) {
  const token = localStorage.getItem("trouvtout_token");
  if (!token) {
    window.location.href = "/auth.html";
  }
}
