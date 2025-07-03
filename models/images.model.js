const { supabase } = require("../services/supabaseClient");
const { v4: uuidv4 } = require("uuid");

const BUCKET_NAME = "images";

const ImageModel = {
  async uploadImage(fileBuffer, mimeType, annonceId) {
    try {
      const fileName = `${uuidv4()}-${Date.now()}`;
      const filePath = `${annonceId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileBuffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        console.error("[SUPABASE][UPLOAD] Erreur upload bucket:", uploadError);
        throw uploadError;
      }

      // Construction d'une URL publique complète et fiable
      const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
      let imageUrl = publicUrlData && publicUrlData.publicUrl ? publicUrlData.publicUrl : null;
      // Correction : forcer une URL publique complète
      if (!imageUrl || !imageUrl.startsWith("http")) {
        const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
        imageUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
      }
      console.log("[DEBUG][ImageModel] URL publique image (corrigée) :", imageUrl);

      const { data: imageData, error: dbError } = await supabase
        .from("images")
        .insert({
          id: uuidv4(),
          annonce_id: annonceId,
          url: imageUrl,
          uploaded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (dbError) {
        await supabase.storage.from(BUCKET_NAME).remove([filePath]);
        console.error("[SUPABASE][INSERT IMAGE] Erreur complète:", dbError);
        throw dbError;
      }

      return imageData;
    } catch (error) {
      console.error("[ERREUR][ImageModel][uploadImage]", error && error.message ? error.message : error);
      if (error && error.stack) console.error(error.stack);
      return null;
    }
  },

  async getImagesByAnnonceId(annonceId) {
    try {
      // On récupère toutes les images associées à l'annonce
      const { data, error } = await supabase
        .from("images")
        .select("*")
        .eq("annonce_id", annonceId)
        .order("uploaded_at", { ascending: true });

      if (error) {
        throw error;
      }

      // Si aucune image trouvée, on tente de récupérer les images du bucket Supabase (fallback)
      if (!data || data.length === 0) {
        // On tente de lister les fichiers du dossier de l'annonce dans le bucket
        const { data: bucketFiles, error: bucketError } = await supabase.storage
          .from(BUCKET_NAME)
          .list(`${annonceId}/`, { limit: 100 });

        if (bucketError) {
          throw bucketError;
        }

        if (bucketFiles && bucketFiles.length > 0) {
          // On construit les URLs publiques pour chaque fichier
          const imagesFromBucket = bucketFiles
            .filter((f) => f.name && !f.name.endsWith(".tmp"))
            .map((f) => {
              const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(`${annonceId}/${f.name}`);
              return {
                id: null,
                annonce_id: annonceId,
                url: publicUrlData.publicUrl,
                uploaded_at: null,
              };
            });
          return imagesFromBucket;
        }
      }

      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération des images pour l'annonce :", error.message);
      return [];
    }
  },

  async deleteImage(imageId, annonceId) {
    try {
      const { data: imageRecord, error: fetchError } = await supabase
        .from("images")
        .select("url")
        .eq("id", imageId)
        .eq("annonce_id", annonceId)
        .single();

      if (fetchError || !imageRecord) {
        console.error("Image non trouvée ou erreur de récupération pour la suppression.");
        return false;
      }

      const urlParts = imageRecord.url.split("/");
      const pathStartIndex = urlParts.indexOf(BUCKET_NAME) + 1;
      const filePathInStorage = urlParts.slice(pathStartIndex).join("/");
      const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([filePathInStorage]);

      if (storageError) {
        console.warn(
          "Erreur lors de la suppression du fichier du stockage, mais tentative de suppression DB :",
          storageError.message
        );
      }

      const { error: dbError } = await supabase.from("images").delete().eq("id", imageId).eq("annonce_id", annonceId);

      if (dbError) {
        throw dbError;
      }

      return true;
    } catch (error) {
      console.error("Erreur lors de la suppression de l'image :", error.message);
      return false;
    }
  },
};

module.exports = ImageModel;
