import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const IMAGES_DIR = path.join(process.cwd(), "images");

// Servir imágenes estáticas
app.use("/images", express.static(IMAGES_DIR));

// Endpoint que devuelve la lista de imágenes
app.get("/api/imagenes", (req, res) => {
  const archivos = fs.readdirSync(IMAGES_DIR);
  const imagenes = archivos.map((nombre) => ({
    nombre,
    url: `http://backend:4000/images/${nombre}`,
  }));
  res.json(imagenes);
});

// Endpoint que obtiene 20 imágenes aleatorias desde la API de Unsplash
app.get("/api/unsplash/imagenes", async (req, res) => {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return res.status(500).json({ error: "Falta la variable de entorno UNSPLASH_ACCESS_KEY." });
  }

  try {
    const response = await fetch("https://api.unsplash.com/photos/random?count=100", {
      headers: { Authorization: `Client-ID ${accessKey}` },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Unsplash API error:", response.status, text);
      return res.status(response.status).json({ error: "Error de la API de Unsplash", details: text });
    }

    const data = await response.json();
    // data es un array de fotos
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

// Bind explicitly to 0.0.0.0 so the server is reachable from Docker host/container mappings.
const PORT = process.env.PORT || 4000;
// Listen on 0.0.0.0 so the server is reachable from outside the container,
// but show the more familiar localhost URL in the log message.
app.listen(PORT, "0.0.0.0", () => console.log(`✅ Backend escuchando en http://localhost:${PORT}`));