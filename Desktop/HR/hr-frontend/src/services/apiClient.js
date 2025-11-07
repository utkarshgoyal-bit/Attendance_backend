import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adds auth token, logs requests, etc.
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request] ${config.method.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handles errors, logs responses, etc.
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Response] ${response.config.method.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  (error) => {
    // Enhanced error handling
    const errorResponse = {
      message: 'An unexpected error occurred',
      status: null,
      data: null,
    };

    if (error.response) {
      // Server responded with error status
      errorResponse.status = error.response.status;
      errorResponse.data = error.response.data;
      errorResponse.message = error.response.data?.message || getErrorMessageByStatus(error.response.status);

      // Log error details
      console.error('[API Response Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response.status,
        message: errorResponse.message,
        data: error.response.data,
      });

      // Handle specific status codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('authToken');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          break;
        case 403:
          errorResponse.message = 'You do not have permission to perform this action';
          break;
        case 404:
          errorResponse.message = 'The requested resource was not found';
          break;
        case 409:
          errorResponse.message = error.response.data?.message || 'A conflict occurred';
          break;
        case 500:
          errorResponse.message = 'Server error. Please try again later.';
          break;
        default:
          break;
      }
    } else if (error.request) {
      // Request was made but no response received
      errorResponse.message = 'No response from server. Please check your internet connection.';
      console.error('[API Network Error]', error.request);
    } else {
      // Something else happened
      errorResponse.message = error.message || 'Failed to make request';
      console.error('[API Error]', error.message);
    }

    // Attach formatted error to the error object
    error.formattedError = errorResponse;

    return Promise.reject(error);
  }
);

// Helper function to get user-friendly error messages
function getErrorMessageByStatus(status) {
  const statusMessages = {
    400: 'Invalid request. Please check your input.',
    401: 'Authentication required. Please log in.',
    403: 'Access denied.',
    404: 'Resource not found.',
    409: 'Conflict detected.',
    422: 'Validation failed.',
    429: 'Too many requests. Please try again later.',
    500: 'Internal server error.',
    502: 'Bad gateway.',
    503: 'Service unavailable.',
    504: 'Gateway timeout.',
  };

  return statusMessages[status] || `Error: ${status}`;
}

// Wrapper functions for common HTTP methods
export const api = {
  /**
   * GET request
   * @param {string} url - Endpoint URL
   * @param {object} params - Query parameters
   * @param {object} config - Additional axios config
   * @returns {Promise} Response data
   */
  get: async (url, params = {}, config = {}) => {
    try {
      const response = await apiClient.get(url, { params, ...config });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error.formattedError || error };
    }
  },

  /**
   * POST request
   * @param {string} url - Endpoint URL
   * @param {object} data - Request body
   * @param {object} config - Additional axios config
   * @returns {Promise} Response data
   */
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await apiClient.post(url, data, config);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error.formattedError || error };
    }
  },

  /**
   * PUT request
   * @param {string} url - Endpoint URL
   * @param {object} data - Request body
   * @param {object} config - Additional axios config
   * @returns {Promise} Response data
   */
  put: async (url, data = {}, config = {}) => {
    try {
      const response = await apiClient.put(url, data, config);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error.formattedError || error };
    }
  },

  /**
   * PATCH request
   * @param {string} url - Endpoint URL
   * @param {object} data - Request body
   * @param {object} config - Additional axios config
   * @returns {Promise} Response data
   */
  patch: async (url, data = {}, config = {}) => {
    try {
      const response = await apiClient.patch(url, data, config);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error.formattedError || error };
    }
  },

  /**
   * DELETE request
   * @param {string} url - Endpoint URL
   * @param {object} config - Additional axios config
   * @returns {Promise} Response data
   */
  delete: async (url, config = {}) => {
    try {
      const response = await apiClient.delete(url, config);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error.formattedError || error };
    }
  },
};

// Export the raw axios instance for advanced use cases
export default apiClient;
