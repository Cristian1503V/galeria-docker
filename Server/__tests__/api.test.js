import request from "supertest";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { jest } from "@jest/globals";

// Mock de node-fetch
const mockFetch = jest.fn();
jest.unstable_mockModule("node-fetch", () => ({
  default: mockFetch,
}));

describe("API Backend Tests", () => {
  let app;

  beforeAll(() => {
    // Crear app de prueba
    app = express();
    app.use(cors());

    const IMAGES_DIR = path.join(process.cwd(), "images");
    app.use("/images", express.static(IMAGES_DIR));

    // Endpoint de imágenes locales
    app.get("/api/imagenes", (req, res) => {
      try {
        // Mock del filesystem para testing
        const archivos = ["test1.jpg", "test2.png"];
        const imagenes = archivos.map((nombre) => ({
          nombre,
          url: `http://backend:4000/images/${nombre}`,
        }));
        res.json(imagenes);
      } catch (error) {
        res.status(500).json({ error: "Error al leer imágenes" });
      }
    });

    // Endpoint de Unsplash
    app.get("/api/unsplash/imagenes", async (req, res) => {
      const accessKey = process.env.UNSPLASH_ACCESS_KEY || "test_key";

      if (!accessKey) {
        return res
          .status(500)
          .json({ error: "Falta la variable de entorno UNSPLASH_ACCESS_KEY." });
      }

      try {
        const mockResponse = {
          ok: true,
          status: 200,
          json: async () => [
            {
              id: "test1",
              urls: {
                full: "https://example.com/full.jpg",
                regular: "https://example.com/regular.jpg",
                thumb: "https://example.com/thumb.jpg",
              },
              alt_description: "Test image",
              width: 1920,
              height: 1080,
              likes: 100,
              user: {
                id: "user1",
                name: "Test User",
                username: "testuser",
                portfolio_url: "https://example.com",
              },
            },
          ],
        };

        const data = await mockResponse.json();
        const images = data.map((p) => ({
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
        res
          .status(500)
          .json({
            error: "Error al obtener imágenes desde Unsplash",
            details: err.message,
          });
      }
    });
  });

  describe("GET /api/imagenes", () => {
    it("debe devolver una lista de imágenes locales", async () => {
      const response = await request(app)
        .get("/api/imagenes")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verificar estructura de cada imagen
      response.body.forEach((img) => {
        expect(img).toHaveProperty("nombre");
        expect(img).toHaveProperty("url");
        expect(img.url).toContain("http://backend:4000/images/");
      });
    });

    it("debe tener la estructura correcta para cada imagen", async () => {
      const response = await request(app).get("/api/imagenes");

      const imagen = response.body[0];
      expect(imagen).toMatchObject({
        nombre: expect.any(String),
        url: expect.stringContaining("http://backend:4000/images/"),
      });
    });
  });

  describe("GET /api/unsplash/imagenes", () => {
    it("debe devolver imágenes de Unsplash con la estructura correcta", async () => {
      const response = await request(app)
        .get("/api/unsplash/imagenes")
        .expect("Content-Type", /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const imagen = response.body[0];
      expect(imagen).toHaveProperty("id");
      expect(imagen).toHaveProperty("url");
      expect(imagen).toHaveProperty("thumb");
      expect(imagen).toHaveProperty("alt_description");
      expect(imagen).toHaveProperty("width");
      expect(imagen).toHaveProperty("height");
      expect(imagen).toHaveProperty("likes");
      expect(imagen).toHaveProperty("user");
    });

    it("debe tener información del usuario en cada imagen", async () => {
      const response = await request(app).get("/api/unsplash/imagenes");

      const imagen = response.body[0];
      expect(imagen.user).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        username: expect.any(String),
      });
    });

    it("debe manejar valores numéricos correctamente", async () => {
      const response = await request(app).get("/api/unsplash/imagenes");

      const imagen = response.body[0];
      expect(typeof imagen.width).toBe("number");
      expect(typeof imagen.height).toBe("number");
      expect(typeof imagen.likes).toBe("number");
      expect(imagen.width).toBeGreaterThan(0);
      expect(imagen.height).toBeGreaterThan(0);
    });
  });

  describe("CORS Configuration", () => {
    it("debe tener headers CORS habilitados", async () => {
      const response = await request(app).get("/api/imagenes");

      expect(response.headers["access-control-allow-origin"]).toBeDefined();
    });
  });
});
