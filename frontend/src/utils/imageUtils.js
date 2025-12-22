import API_CONFIG from '../config/api';

/**
 * Get the correct image URL for display
 * Handles both relative paths (/uploads/...) and absolute URLs
 * @param {string} imagePath - The image path from the database
 * @returns {string} - The full URL to the image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return null;
  }

  // If it's already a full URL (http:// or https://), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it's a relative path starting with /uploads/, prefix with BASE_URL
  if (imagePath.startsWith('/uploads/')) {
    // Ensure BASE_URL doesn't end with / and imagePath starts with /
    const baseUrl = API_CONFIG.BASE_URL.replace(/\/+$/, '');
    return `${baseUrl}${imagePath}`;
  }

  // For other relative paths, also prefix with BASE_URL
  // This handles cases where image path might be just "uploads/filename.png"
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/+$/, '');
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Get image URL with fallback to placeholder
 * @param {string} imagePath - The image path from the database
 * @param {string} placeholder - Optional placeholder URL (default: placeholder image)
 * @returns {string} - The full URL to the image or placeholder
 */
export const getImageUrlWithFallback = (imagePath, placeholder = 'https://via.placeholder.com/300x200?text=Image') => {
  const url = getImageUrl(imagePath);
  return url || placeholder;
};

