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

// Log API configuration (helpful for debugging in both dev and production)
console.log('API Configuration:', API_CONFIG);
if (API_CONFIG.BASE_URL === 'https://lms-f679.onrender.com' && import.meta.env.PROD) {
  console.warn('⚠️ WARNING: Using default localhost:4000 in production!');
  console.warn('⚠️ Set VITE_API_BASE_URL environment variable to your backend server URL');
  console.warn('⚠️ Example: VITE_API_BASE_URL=https://your-backend-domain.com');
}

export default API_CONFIG;


