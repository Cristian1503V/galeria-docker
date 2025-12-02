import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

// Crear y exportar la app (sin ejecutar listen)
// Acepta dependencias inyectadas para testing
export const createApp = (dependencies = {}) => {
  // Dependency injection: permite mockear dependencias en tests
  const {
    fetchFn = fetch,
    fsFn = fs,
    pathFn = path,
  } = dependencies;

  const app = express();
  app.use(cors());

  const IMAGES_DIR = pathFn.join(process.cwd(), "images");
  app.use("/images", express.static(IMAGES_DIR));

  app.get("/api/imagenes", (req, res) => {
    try {
      const archivos = fsFn.readdirSync(IMAGES_DIR);
      const imagenes = archivos.map((nombre) => ({
        nombre,
        url: `http://backend:4000/images/${nombre}`,
      }));
      res.json(imagenes);
    } catch (err) {
      console.error("Error al leer directorio de imágenes:", err);
      res.status(500).json({ error: "Error al leer el directorio de imágenes", details: err.message });
    }
  });

  app.get("/api/unsplash/imagenes", async (req, res) => {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      return res.status(500).json({ error: "Falta la variable de entorno UNSPLASH_ACCESS_KEY." });
    }

    try {
      const response = await fetchFn("https://api.unsplash.com/photos/random?count=100", {
        headers: { Authorization: `Client-ID ${accessKey}` },
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Unsplash API error:", response.status, text);
        return res.status(response.status).json({ error: "Error de la API de Unsplash", details: text });
      }

      const data = await response.json();
      const images = (Array.isArray(data) ? data : [data]).map((p) => ({
        id: p.id,
        url: p.urls?.full || p.urls?.regular || p.urls?.small,
        thumb: p.urls?.thumb,
        alt_description: p.alt_description,
        width: p.width,
        height: p.height,
        likes: p.likes,
        user: {
          id: p.user?.id,
          name: p.user?.name,
          username: p.user?.username,
          portfolio_url: p.user?.portfolio_url,
        },
      }));

      res.json(images);
    } catch (err) {
      console.error("Error al obtener imágenes de Unsplash:", err);
      res.status(500).json({ error: "Error al obtener imágenes desde Unsplash", details: err.message });
    }
  });

  return app;
};

// Solo ejecutar el servidor si se llama directamente (no en tests)
/* istanbul ignore next */
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createApp();
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, "0.0.0.0", () => console.log(`✅ Backend escuchando en http://localhost:${PORT}`));
}