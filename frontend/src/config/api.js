// API Configuration
// Use environment variable or fallback to localhost for development
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  // Validate environment variable if provided
  if (envUrl) {
    const trimmedUrl = envUrl.trim();
    // Check if it's a valid URL format
    if (trimmedUrl && (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://'))) {
      // Remove trailing slash if present
      return trimmedUrl.replace(/\/+$/, '');
    } else if (trimmedUrl) {
      console.warn('Invalid VITE_API_BASE_URL format. Should start with http:// or https://. Using default.');
    }
  }
  
  // Default fallback
  return 'https://lms-f679.onrender.com';
};

const API_BASE_URL = getApiBaseUrl();

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  API_URL: `${API_BASE_URL}/api`,
};

// Log API configuration in development (helpful for debugging)
if (import.meta.env.DEV) {
  console.log('API Configuration:', API_CONFIG);
}

export default API_CONFIG;


