import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchImages,
  isValidImageUrl,
  formatLikes,
  isValidImageObject,
  filterValidImages,
  getImageAltText,
} from "../utils/imageHelpers.js";

describe("Image Helpers", () => {
  describe("isValidImageUrl", () => {
    it("debe validar URLs de imágenes correctamente", () => {
      expect(isValidImageUrl("https://example.com/image.jpg")).toBe(true);
      expect(isValidImageUrl("https://example.com/photo.png")).toBe(true);
      expect(isValidImageUrl("https://example.com/pic.gif")).toBe(true);
      expect(isValidImageUrl("https://example.com/img.webp")).toBe(true);
      expect(isValidImageUrl("https://images.unsplash.com/photo-123")).toBe(
        true
      );
    });

    it("debe rechazar URLs inválidas", () => {
      expect(isValidImageUrl("https://example.com/document.pdf")).toBe(false);
      expect(isValidImageUrl("not-a-url")).toBe(false);
      expect(isValidImageUrl("")).toBe(false);
      expect(isValidImageUrl(null)).toBe(false);
      expect(isValidImageUrl(undefined)).toBe(false);
      expect(isValidImageUrl(123)).toBe(false);
    });

    it("debe ser case-insensitive", () => {
      expect(isValidImageUrl("https://example.com/IMAGE.JPG")).toBe(true);
      expect(isValidImageUrl("https://example.com/Photo.PNG")).toBe(true);
    });
  });

  describe("formatLikes", () => {
    it("debe formatear números pequeños sin cambios", () => {
      expect(formatLikes(0)).toBe("0");
      expect(formatLikes(50)).toBe("50");
      expect(formatLikes(999)).toBe("999");
    });

    it('debe formatear números grandes con "K"', () => {
      expect(formatLikes(1000)).toBe("1.0K");
      expect(formatLikes(1500)).toBe("1.5K");
      expect(formatLikes(2300)).toBe("2.3K");
      expect(formatLikes(10000)).toBe("10.0K");
    });

    it("debe manejar valores inválidos", () => {
      expect(formatLikes(NaN)).toBe("0");
      expect(formatLikes("not-a-number")).toBe("0");
      expect(formatLikes(null)).toBe("0");
      expect(formatLikes(undefined)).toBe("0");
    });
  });

  describe("isValidImageObject", () => {
    it("debe validar objetos de imagen correctos", () => {
      const validImage = {
        url: "https://example.com/image.jpg",
        alt_description: "Test image",
      };

      expect(isValidImageObject(validImage)).toBe(true);
    });

    it("debe rechazar objetos sin URL", () => {
      const invalidImage = {
        alt_description: "Test image",
      };

      expect(isValidImageObject(invalidImage)).toBe(false);
    });

    it("debe rechazar objetos con URL inválida", () => {
      const invalidImage = {
        url: "not-an-image.txt",
        alt_description: "Test",
      };

      expect(isValidImageObject(invalidImage)).toBe(false);
    });

    it("debe rechazar valores no-objeto", () => {
      expect(isValidImageObject(null)).toBe(false);
      expect(isValidImageObject(undefined)).toBe(false);
      expect(isValidImageObject("string")).toBe(false);
      expect(isValidImageObject(123)).toBe(false);
    });
  });

  describe("filterValidImages", () => {
    it("debe filtrar solo imágenes válidas", () => {
      const images = [
        { url: "https://example.com/image1.jpg" },
        { url: "invalid.txt" },
        { url: "https://example.com/image2.png" },
        { alt_description: "No URL" },
      ];

      const filtered = filterValidImages(images);

      expect(filtered).toHaveLength(2);
      expect(filtered[0].url).toBe("https://example.com/image1.jpg");
      expect(filtered[1].url).toBe("https://example.com/image2.png");
    });

    it("debe retornar array vacío si el input no es array", () => {
      expect(filterValidImages(null)).toEqual([]);
      expect(filterValidImages(undefined)).toEqual([]);
      expect(filterValidImages("not-array")).toEqual([]);
      expect(filterValidImages({})).toEqual([]);
    });

    it("debe retornar array vacío si todas las imágenes son inválidas", () => {
      const invalidImages = [
        { url: "invalid1.txt" },
        { url: "invalid2.pdf" },
        { description: "No URL" },
      ];

      expect(filterValidImages(invalidImages)).toEqual([]);
    });
  });

  describe("getImageAltText", () => {
    it("debe retornar alt_description si existe", () => {
      const image = {
        alt_description: "Beautiful sunset",
        user: { name: "John Doe" },
      };

      expect(getImageAltText(image)).toBe("Beautiful sunset");
    });

    it("debe usar description si no hay alt_description", () => {
      const image = {
        description: "Mountain view",
        user: { name: "Jane Smith" },
      };

      expect(getImageAltText(image)).toBe("Mountain view");
    });

    it("debe usar el nombre del usuario si no hay descripción", () => {
      const image = {
        user: { name: "Test User" },
      };

      expect(getImageAltText(image)).toBe("Photo by Test User");
    });

    it('debe retornar "Image" por defecto', () => {
      expect(getImageAltText({})).toBe("Image");
      expect(getImageAltText(null)).toBe("Image");
      expect(getImageAltText(undefined)).toBe("Image");
    });
  });

  describe("fetchImages", () => {
    beforeEach(() => {
      // Limpiar mocks antes de cada prueba
      vi.clearAllMocks();
      // Silenciar console.error para tests
      vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      // Restaurar console.error después de cada test
      vi.restoreAllMocks();
    });

    it("debe retornar imágenes cuando la respuesta es exitosa", async () => {
      const mockImages = [
        { id: "1", url: "https://example.com/image1.jpg" },
        { id: "2", url: "https://example.com/image2.jpg" },
      ];

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockImages),
        })
      );

      const result = await fetchImages("http://api.test.com/images");

      expect(result).toEqual(mockImages);
      expect(global.fetch).toHaveBeenCalledWith("http://api.test.com/images");
    });

    it("debe retornar array vacío cuando hay un error HTTP", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
        })
      );

      const result = await fetchImages("http://api.test.com/images");

      expect(result).toEqual([]);
    });

    it("debe retornar array vacío cuando fetch falla", async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error("Network error")));

      const result = await fetchImages("http://api.test.com/images");

      expect(result).toEqual([]);
    });

    it("debe manejar respuestas JSON inválidas", async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.reject(new Error("Invalid JSON")),
        })
      );

      const result = await fetchImages("http://api.test.com/images");

      expect(result).toEqual([]);
    });
  });
});
