import API_CONFIG from '../config/api';

/**
 * Make an authenticated API request
 * Handles 401 errors by redirecting to login
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('adminToken');
  
  // If no token, redirect to login
  if (!token) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    window.location.href = '/admin/login';
    throw new Error('No authentication token');
  }

  // Add authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized - token expired or invalid
  if (response.status === 401) {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    window.location.href = '/admin/login';
    throw new Error('Authentication failed. Please login again.');
  }

  return response;
};

/**
 * Get authenticated headers for fetch requests
 * @returns {object} Headers object with Authorization
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  
  if (!token) {
    return {};
  }

  return {
    'Authorization': `Bearer ${token}`,
  };
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('adminToken');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

