/**
 * Función auxiliar para obtener imágenes desde la API
 * @param {string} apiUrl - URL de la API
 * @returns {Promise<Array>} - Array de imágenes
 */
export async function fetchImages(apiUrl) {
  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const images = await response.json();
    return images;
  } catch (error) {
    console.error("Error fetching images:", error);
    return [];
  }
}

/**
 * Valida si una URL de imagen es válida
 * @param {string} url - URL a validar
 * @returns {boolean}
 */
export function isValidImageUrl(url) {
  if (!url || typeof url !== "string") {
    return false;
  }

  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  const lowerUrl = url.toLowerCase();

  return (
    imageExtensions.some((ext) => lowerUrl.includes(ext)) ||
    lowerUrl.includes("unsplash.com")
  );
}

/**
 * Formatea el número de likes para mostrar
 * @param {number} likes - Número de likes
 * @returns {string} - Likes formateados (ej: "1K", "2.5K")
 */
export function formatLikes(likes) {
  if (typeof likes !== "number" || isNaN(likes)) {
    return "0";
  }

  if (likes >= 1000) {
    return `${(likes / 1000).toFixed(1)}K`;
  }

  return likes.toString();
}

/**
 * Valida la estructura de un objeto de imagen
 * @param {Object} image - Objeto de imagen a validar
 * @returns {boolean}
 */
export function isValidImageObject(image) {
  if (!image || typeof image !== "object") {
    return false;
  }

  const requiredFields = ["url"];
  const hasRequiredFields = requiredFields.every((field) => field in image);

  return hasRequiredFields && isValidImageUrl(image.url);
}

/**
 * Filtra y valida un array de imágenes
 * @param {Array} images - Array de imágenes
 * @returns {Array} - Array de imágenes válidas
 */
export function filterValidImages(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images.filter((img) => isValidImageObject(img));
}

/**
 * Obtiene el texto alternativo de una imagen
 * @param {Object} image - Objeto de imagen
 * @returns {string}
 */
export function getImageAltText(image) {
  if (!image) {
    return "Image";
  }

  if (image.alt_description) {
    return image.alt_description;
  }

  if (image.description) {
    return image.description;
  }

  if (image.user?.name) {
    return `Photo by ${image.user.name}`;
  }

  return "Image";
}
