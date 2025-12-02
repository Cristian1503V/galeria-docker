import { describe, it, expect } from '@jest/globals';

/**
 * Pruebas unitarias para funciones auxiliares
 */

describe('Utilidades del Backend', () => {
  describe('Transformación de datos de imágenes', () => {
    it('debe transformar correctamente los datos de Unsplash', () => {
      const mockUnsplashData = {
        id: 'abc123',
        urls: {
          full: 'https://example.com/full.jpg',
          regular: 'https://example.com/regular.jpg',
          small: 'https://example.com/small.jpg',
          thumb: 'https://example.com/thumb.jpg'
        },
        alt_description: 'Beautiful landscape',
        width: 4000,
        height: 3000,
        likes: 250,
        user: {
          id: 'user123',
          name: 'John Doe',
          username: 'johndoe',
          portfolio_url: 'https://johndoe.com'
        }
      };
      
      // Función de transformación (similar a la del servidor)
      const transformImage = (p) => ({
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
      });
      
      const result = transformImage(mockUnsplashData);
      
      expect(result).toEqual({
        id: 'abc123',
        url: 'https://example.com/full.jpg',
        thumb: 'https://example.com/thumb.jpg',
        alt_description: 'Beautiful landscape',
        width: 4000,
        height: 3000,
        likes: 250,
        user: {
          id: 'user123',
          name: 'John Doe',
          username: 'johndoe',
          portfolio_url: 'https://johndoe.com'
        }
      });
    });
    
    it('debe manejar datos incompletos de manera segura', () => {
      const mockIncompleteData = {
        id: 'xyz789',
        urls: {},
        width: 1920,
        height: 1080,
        likes: 10,
        user: {
          name: 'Jane Smith'
        }
      };
      
      const transformImage = (p) => ({
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
      });
      
      const result = transformImage(mockIncompleteData);
      
      expect(result.id).toBe('xyz789');
      expect(result.url).toBeUndefined();
      expect(result.user.name).toBe('Jane Smith');
      expect(result.user.id).toBeUndefined();
    });
    
    it('debe priorizar la URL correctamente (full > regular > small)', () => {
      const testCases = [
        {
          urls: { full: 'full.jpg', regular: 'regular.jpg', small: 'small.jpg' },
          expected: 'full.jpg'
        },
        {
          urls: { regular: 'regular.jpg', small: 'small.jpg' },
          expected: 'regular.jpg'
        },
        {
          urls: { small: 'small.jpg' },
          expected: 'small.jpg'
        },
        {
          urls: {},
          expected: undefined
        }
      ];
      
      testCases.forEach(({ urls, expected }) => {
        const result = urls.full || urls.regular || urls.small;
        expect(result).toBe(expected);
      });
    });
  });
  
  describe('Validación de variables de entorno', () => {
    it('debe validar la presencia de UNSPLASH_ACCESS_KEY', () => {
      const validateEnv = (env) => {
        if (!env.UNSPLASH_ACCESS_KEY) {
          throw new Error('Falta la variable de entorno UNSPLASH_ACCESS_KEY.');
        }
        return true;
      };
      
      expect(() => validateEnv({})).toThrow('Falta la variable de entorno UNSPLASH_ACCESS_KEY.');
      expect(validateEnv({ UNSPLASH_ACCESS_KEY: 'test_key' })).toBe(true);
    });
  });
  
  describe('Construcción de URLs', () => {
    it('debe construir URLs de imágenes correctamente', () => {
      const buildImageUrl = (nombre) => `http://backend:4000/images/${nombre}`;
      
      expect(buildImageUrl('foto1.jpg')).toBe('http://backend:4000/images/foto1.jpg');
      expect(buildImageUrl('imagen.png')).toBe('http://backend:4000/images/imagen.png');
    });
    
    it('debe manejar nombres con espacios o caracteres especiales', () => {
      const buildImageUrl = (nombre) => `http://backend:4000/images/${nombre}`;
      
      expect(buildImageUrl('foto test.jpg')).toBe('http://backend:4000/images/foto test.jpg');
      expect(buildImageUrl('ñandú-árbol.jpg')).toBe('http://backend:4000/images/ñandú-árbol.jpg');
    });
  });
});

