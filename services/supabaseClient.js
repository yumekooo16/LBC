const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const jwtSecret = process.env.JWT_SECRET;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERREUR: Les variables d'environnement SUPABASE_URL ou SUPABASE_ANON_KEY sont manquantes.");
  process.exit(1);
}
if (!jwtSecret) {
  console.warn(
    "ATTENTION: La variable d'environnement JWT_SECRET est manquante. Cela pourrait affecter les fonctionnalités qui nécessitent la génération ou la validation de JWT personnalisés."
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = {
  supabase,
  jwtSecret,
};
