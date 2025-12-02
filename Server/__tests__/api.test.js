import request from "supertest";
import { jest } from "@jest/globals";

describe("API Backend Tests - Express App", () => {
  let app;
  let mockFetch;
  let mockFs;
  let mockPath;
  let createApp;
  let originalEnv;

  // ============================================
  // SETUP Y TEARDOWN
  // ============================================
  beforeAll(async () => {
    // Guardar variables de entorno originales
    originalEnv = { ...process.env };
    
    // Importar createApp
    const indexModule = await import("../index.js");
    createApp = indexModule.createApp;
  });

  beforeEach(() => {
    // Restaurar variables de entorno antes de cada test
    process.env = { ...originalEnv };
    process.env.UNSPLASH_ACCESS_KEY = "test_access_key_12345";

    // Crear mocks frescos para cada test
    mockFetch = jest.fn();
    mockPath = {
      join: jest.fn((...args) => args.join("/")),
    };
    mockFs = {
      readdirSync: jest.fn(),
    };

    // Crear app con dependencias mockeadas
    app = createApp({
      fetchFn: mockFetch,
      fsFn: mockFs,
      pathFn: mockPath,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restaurar variables de entorno originales
    process.env = originalEnv;
  });

  // ============================================
  // TESTS: GET /api/imagenes (Imágenes Locales)
  // ============================================
  describe("GET /api/imagenes", () => {
    describe("Casos exitosos", () => {
      it("debe devolver una lista de imágenes locales con la estructura correcta", async () => {
        // Arrange
        const mockFiles = ["imagen1.jpg", "imagen2.png", "foto3.gif"];
        mockFs.readdirSync.mockReturnValue(mockFiles);

        // Act
        const response = await request(app)
          .get("/api/imagenes")
          .expect("Content-Type", /json/)
          .expect(200);

        // Assert
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(3);
        
        response.body.forEach((img, index) => {
          expect(img).toHaveProperty("nombre");
          expect(img).toHaveProperty("url");
          expect(img.nombre).toBe(mockFiles[index]);
          expect(img.url).toBe(`http://backend:4000/images/${mockFiles[index]}`);
        });

        expect(mockFs.readdirSync).toHaveBeenCalledTimes(1);
      });

      it("debe devolver un array vacío cuando no hay imágenes", async () => {
        // Arrange
        mockFs.readdirSync.mockReturnValue([]);

        // Act
        const response = await request(app)
          .get("/api/imagenes")
          .expect(200);

        // Assert
        expect(response.body).toEqual([]);
      });

      it("debe manejar nombres de archivos con caracteres especiales", async () => {
        // Arrange
        const mockFiles = ["imagen con espacios.jpg", "foto-guión.png", "foto_underscore.jpg"];
        mockFs.readdirSync.mockReturnValue(mockFiles);

        // Act
        const response = await request(app)
          .get("/api/imagenes")
          .expect(200);

        // Assert
        expect(response.body).toHaveLength(3);
        response.body.forEach((img, index) => {
          expect(img.url).toContain(mockFiles[index]);
        });
      });
    });

    describe("Casos de error", () => {
      it("debe manejar error al leer el directorio (permiso denegado)", async () => {
        // Arrange
        const mockError = new Error("EACCES: permission denied");
        mockError.code = "EACCES";
        mockFs.readdirSync.mockImplementation(() => {
          throw mockError;
        });

        // Act
        const response = await request(app)
          .get("/api/imagenes")
          .expect("Content-Type", /json/)
          .expect(500);

        // Assert
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toContain("Error al leer el directorio de imágenes");
        expect(response.body).toHaveProperty("details");
      });

      it("debe manejar error cuando el directorio no existe", async () => {
        // Arrange
        const mockError = new Error("ENOENT: no such file or directory");
        mockError.code = "ENOENT";
        mockFs.readdirSync.mockImplementation(() => {
          throw mockError;
        });

        // Act
        const response = await request(app)
          .get("/api/imagenes")
          .expect(500);

        // Assert
        expect(response.body.error).toBe("Error al leer el directorio de imágenes");
      });
    });
  });

  // ============================================
  // TESTS: GET /api/unsplash/imagenes
  // ============================================
  describe("GET /api/unsplash/imagenes", () => {
    describe("Casos exitosos", () => {
      it("debe devolver imágenes de Unsplash con la estructura completa", async () => {
        // Arrange
        const mockUnsplashResponse = [
          {
            id: "photo1",
            urls: {
              full: "https://images.unsplash.com/photo1?full",
              regular: "https://images.unsplash.com/photo1?regular",
              small: "https://images.unsplash.com/photo1?small",
              thumb: "https://images.unsplash.com/photo1?thumb",
            },
            alt_description: "A beautiful sunset",
            width: 1920,
            height: 1080,
            likes: 150,
            user: {
              id: "user1",
              name: "John Doe",
              username: "johndoe",
              portfolio_url: "https://portfolio.example.com",
            },
          },
          {
            id: "photo2",
            urls: {
              full: "https://images.unsplash.com/photo2?full",
              regular: "https://images.unsplash.com/photo2?regular",
              small: "https://images.unsplash.com/photo2?small",
              thumb: "https://images.unsplash.com/photo2?thumb",
            },
            alt_description: "Mountain landscape",
            width: 2560,
            height: 1440,
            likes: 320,
            user: {
              id: "user2",
              name: "Jane Smith",
              username: "janesmith",
              portfolio_url: "https://jane.example.com",
            },
          },
        ];

        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockUnsplashResponse,
        });

        // Act
        const response = await request(app)
          .get("/api/unsplash/imagenes")
          .expect("Content-Type", /json/)
          .expect(200);

        // Assert
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(2);

        const imagen1 = response.body[0];
        expect(imagen1).toMatchObject({
          id: "photo1",
          url: "https://images.unsplash.com/photo1?full",
          thumb: "https://images.unsplash.com/photo1?thumb",
          alt_description: "A beautiful sunset",
          width: 1920,
          height: 1080,
          likes: 150,
          user: {
            id: "user1",
            name: "John Doe",
            username: "johndoe",
            portfolio_url: "https://portfolio.example.com",
          },
        });

        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.unsplash.com/photos/random?count=100",
          {
            headers: { Authorization: "Client-ID test_access_key_12345" },
          }
        );
      });

      it("debe usar 'regular' URL cuando 'full' no está disponible", async () => {
        // Arrange
        const mockResponse = [{
          id: "photo1",
          urls: {
            regular: "https://images.unsplash.com/photo1?regular",
            small: "https://images.unsplash.com/photo1?small",
            thumb: "https://images.unsplash.com/photo1?thumb",
          },
          alt_description: null,
          width: 1024,
          height: 768,
          likes: 50,
          user: {
            id: "user1",
            name: "Test User",
            username: "testuser",
          },
        }];

        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        // Act
        const response = await request(app)
          .get("/api/unsplash/imagenes")
          .expect(200);

        // Assert
        expect(response.body[0].url).toBe("https://images.unsplash.com/photo1?regular");
      });

      it("debe usar 'small' URL cuando 'full' y 'regular' no están disponibles", async () => {
        // Arrange
        const mockResponse = [{
          id: "photo1",
          urls: {
            small: "https://images.unsplash.com/photo1?small",
            thumb: "https://images.unsplash.com/photo1?thumb",
          },
          alt_description: null,
          width: 800,
          height: 600,
          likes: 25,
          user: {
            id: "user1",
            name: "Test User",
            username: "testuser",
          },
        }];

        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        // Act
        const response = await request(app)
          .get("/api/unsplash/imagenes")
          .expect(200);

        // Assert
        expect(response.body[0].url).toBe("https://images.unsplash.com/photo1?small");
      });

      it("debe manejar respuesta con un solo objeto (no array)", async () => {
        // Arrange
        const mockResponse = {
          id: "single_photo",
          urls: {
            full: "https://images.unsplash.com/single?full",
            thumb: "https://images.unsplash.com/single?thumb",
          },
          alt_description: "Single image",
          width: 1920,
          height: 1080,
          likes: 100,
          user: {
            id: "user1",
            name: "Single User",
            username: "singleuser",
          },
        };

        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        // Act
        const response = await request(app)
          .get("/api/unsplash/imagenes")
          .expect(200);

        // Assert
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].id).toBe("single_photo");
      });

      it("debe manejar valores undefined/null en campos opcionales", async () => {
        // Arrange
        const mockResponse = [{
          id: "photo1",
          urls: {
            full: "https://images.unsplash.com/photo1?full",
          },
          alt_description: null,
          width: 1920,
          height: 1080,
          likes: 0,
          user: {
            id: "user1",
            name: "Test User",
            username: "testuser",
            portfolio_url: null,
          },
        }];

        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        // Act
        const response = await request(app)
          .get("/api/unsplash/imagenes")
          .expect(200);

        // Assert
        expect(response.body[0]).toMatchObject({
          id: "photo1",
          alt_description: null,
          likes: 0,
          user: {
            portfolio_url: null,
          },
        });
      });
    });

    describe("Validación de tipos de datos", () => {
      it("debe tener números para width, height y likes", async () => {
        // Arrange
        const mockResponse = [{
          id: "photo1",
          urls: { full: "https://example.com/image.jpg", thumb: "https://example.com/thumb.jpg" },
          alt_description: "Test",
          width: 3000,
          height: 2000,
          likes: 500,
          user: { id: "u1", name: "User", username: "user" },
        }];

        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        // Act
        const response = await request(app)
          .get("/api/unsplash/imagenes")
          .expect(200);

        // Assert
        const img = response.body[0];
        expect(typeof img.width).toBe("number");
        expect(typeof img.height).toBe("number");
        expect(typeof img.likes).toBe("number");
        expect(img.width).toBe(3000);
        expect(img.height).toBe(2000);
        expect(img.likes).toBe(500);
      });

      it("debe tener strings para IDs y nombres", async () => {
        // Arrange
        const mockResponse = [{
          id: "photo123",
          urls: { full: "https://example.com/image.jpg", thumb: "https://example.com/thumb.jpg" },
          alt_description: "Test description",
          width: 1920,
          height: 1080,
          likes: 100,
          user: {
            id: "user456",
            name: "Jane Doe",
            username: "janedoe",
            portfolio_url: "https://portfolio.com",
          },
        }];

        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockResponse,
        });

        // Act
        const response = await request(app)
          .get("/api/unsplash/imagenes")
          .expect(200);

        // Assert
        const img = response.body[0];
        expect(typeof img.id).toBe("string");
        expect(typeof img.url).toBe("string");
        expect(typeof img.alt_description).toBe("string");
        expect(typeof img.user.name).toBe("string");
        expect(typeof img.user.username).toBe("string");
      });
    });

    describe("Manejo de errores de API", () => {
      it("debe manejar error 401 Unauthorized (API key inválida)", async () => {
        // Arrange
        mockFetch.mockResolvedValue({
          ok: false,
          status: 401,
          text: async () => "Unauthorized",
        });

        // Act
        const response = await request(app)
          .get("/api/unsplash/imagenes")
          .expect("Content-Type", /json/)
          .expect(401);

        // Assert
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("Error de la API de Unsplash");
        expect(response.body).toHaveProperty("details");
        expect(response.body.details).toBe("Unauthorized");
      });

      it("debe manejar error 403 Forbidden (rate limit excedido)", async () => {
        // Arrange
        mockFetch.mockResolvedValue({
          ok: false,
          status: 403,
          text: async () => "Rate Limit Exceeded",
        });

        // Act
        const response = await request(app)
          .get("/api/unsplash/imagenes")
          .expect(403);

        // Assert
        expect(response.body.error).toBe("Error de la API de Unsplash");
        expect(response.body.details).toBe("Rate Limit Exceeded");
      });

      it("debe manejar error 404 Not Found", async () => {
        // Arrange
        mockFetch.mockResolvedValue({
          ok: false,
          status: 404,
          text: async () => "Not Found",
        });

        // Act
        const response = await request(app)
          .get("/api/unsplash/imagenes")
          .expect(404);

        // Assert
        expect(response.body.error).toBe("Error de la API de Unsplash");
      });

      it("debe manejar error 500 Internal Server Error de Unsplash", async () => {
        // Arrange
        mockFetch.mockResolvedValue({
          ok: false,
          status: 500,
          text: async () => "Internal Server Error",
        });

        // Act
        const response = await request(app)
          .get("/api/unsplash/imagenes")
          .expect(500);

        // Assert
        expect(response.body.error).toBe("Error de la API de Unsplash");
        expect(response.body.details).toBe("Internal Server Error");
      });
    });

    describe("Manejo de errores de red y excepciones", () => {
      it("debe manejar error de red (fetch falla)", async () => {
        // Arrange
        mockFetch.mockRejectedValue(new Error("Network error: ECONNREFUSED"));

        // Act
        const response = await request(app)
          .get("/api/unsplash/imagenes")
          .expect("Content-Type", /json/)
          .expect(500);

        // Assert
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("Error al obtener imágenes desde Unsplash");
        expect(response.body.details).toBe("Network error: ECONNREFUSED");
      });

      it("debe manejar timeout de conexión", async () => {
        // Arrange
        mockFetch.mockRejectedValue(new Error("Timeout"));

        // Act
        const response = await request(app)
          .get("/api/unsplash/imagenes")
          .expect(500);

        // Assert
        expect(response.body.error).toBe("Error al obtener imágenes desde Unsplash");
        expect(response.body.details).toBe("Timeout");
      });

      it("debe manejar respuesta JSON inválida", async () => {
        // Arrange
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => {
            throw new Error("Unexpected token in JSON");
          },
        });

        // Act
        const response = await request(app)
          .get("/api/unsplash/imagenes")
          .expect(500);

        // Assert
        expect(response.body.error).toBe("Error al obtener imágenes desde Unsplash");
        expect(response.body.details).toContain("JSON");
      });
    });

    describe("Validación de configuración", () => {
      it("debe retornar error 500 cuando falta UNSPLASH_ACCESS_KEY", async () => {
        // Arrange
        delete process.env.UNSPLASH_ACCESS_KEY;
        
        // Recrear app sin la variable de entorno
        app = createApp({
          fetchFn: mockFetch,
          fsFn: mockFs,
          pathFn: mockPath,
        });

        // Act
        const response = await request(app)
          .get("/api/unsplash/imagenes")
          .expect("Content-Type", /json/)
          .expect(500);

        // Assert
        expect(response.body).toHaveProperty("error");
        expect(response.body.error).toBe("Falta la variable de entorno UNSPLASH_ACCESS_KEY.");
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it("debe retornar error cuando UNSPLASH_ACCESS_KEY está vacía", async () => {
        // Arrange
        process.env.UNSPLASH_ACCESS_KEY = "";
        
        app = createApp({
          fetchFn: mockFetch,
          fsFn: mockFs,
          pathFn: mockPath,
        });

        // Act
        const response = await request(app)
          .get("/api/unsplash/imagenes")
          .expect(500);

        // Assert
        expect(response.body.error).toBe("Falta la variable de entorno UNSPLASH_ACCESS_KEY.");
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it("debe usar la UNSPLASH_ACCESS_KEY correcta en la petición", async () => {
        // Arrange
        process.env.UNSPLASH_ACCESS_KEY = "custom_key_xyz789";
        
        app = createApp({
          fetchFn: mockFetch,
          fsFn: mockFs,
          pathFn: mockPath,
        });

        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => [],
        });

        // Act
        await request(app)
          .get("/api/unsplash/imagenes")
          .expect(200);

        // Assert
        expect(mockFetch).toHaveBeenCalledWith(
          "https://api.unsplash.com/photos/random?count=100",
          {
            headers: { Authorization: "Client-ID custom_key_xyz789" },
          }
        );
      });
    });
  });

  // ============================================
  // TESTS: Configuración CORS
  // ============================================
  describe("Configuración de CORS", () => {
    it("debe tener headers CORS habilitados en /api/imagenes", async () => {
      // Arrange
      mockFs.readdirSync.mockReturnValue([]);

      // Act
      const response = await request(app).get("/api/imagenes");

      // Assert
      expect(response.headers["access-control-allow-origin"]).toBeDefined();
    });

    it("debe tener headers CORS habilitados en /api/unsplash/imagenes", async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => [],
      });

      // Act
      const response = await request(app).get("/api/unsplash/imagenes");

      // Assert
      expect(response.headers["access-control-allow-origin"]).toBeDefined();
    });
  });

  // ============================================
  // TESTS: Rutas no existentes
  // ============================================
  describe("Manejo de rutas no existentes", () => {
    it("debe retornar 404 para rutas no definidas", async () => {
      const response = await request(app)
        .get("/api/ruta-no-existe")
        .expect(404);
    });

    it("debe retornar 404 para métodos HTTP no soportados", async () => {
      await request(app)
        .post("/api/imagenes")
        .expect(404);
    });
  });
});