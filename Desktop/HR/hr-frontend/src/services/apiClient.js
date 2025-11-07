/**
 * Centralized API Client for HR Management System
 *
 * This module configures and exports an axios instance with:
 * - Base URL configuration
 * - Request/Response interceptors
 * - Centralized error handling
 * - Request logging for debugging
 */

import axios from 'axios';

/**
 * Create axios instance with base configuration
 *
 * baseURL: All API requests will be prefixed with this URL
 * timeout: Requests will fail if they take longer than 10 seconds
 */
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 *
 * Runs before every request is sent
 * - Logs the request method and URL for debugging
 * - Can be used to add auth tokens, modify headers, etc.
 */
apiClient.interceptors.request.use(
  (config) => {
    // Log outgoing request
    console.log(`Making ${config.method.toUpperCase()} request to ${config.url}`);

    // You can add auth tokens here if needed
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }

    return config;
  },
  (error) => {
    // Handle request errors
    console.error('Request Error:', error.message);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 *
 * Runs after every response is received
 * - Handles successful responses
 * - Provides centralized error handling for failed requests
 * - Logs errors with detailed information
 */
apiClient.interceptors.response.use(
  (response) => {
    // Successfully received response - return data
    return response;
  },
  (error) => {
    // Handle error responses
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
    const url = error.config?.url || 'UNKNOWN';

    // Log error details
    console.error(`API Error: ${method} ${url} - ${error.message}`);

    // Handle specific error scenarios
    if (error.response) {
      // Server responded with error status code (4xx, 5xx)
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);

      // You can handle specific status codes here
      // if (error.response.status === 401) {
      //   // Handle unauthorized - redirect to login
      //   window.location.href = '/login';
      // }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received from server');
    } else {
      // Something else happened while setting up the request
      console.error('Error setting up request:', error.message);
    }

    // Reject the promise so the calling code can handle the error
    return Promise.reject(error);
  }
);

/**
 * Export the configured axios instance
 *
 * Usage:
 * import apiClient from './services/apiClient';
 *
 * apiClient.get('/employees')
 * apiClient.post('/salaries', data)
 * apiClient.put('/employees/123', data)
 * apiClient.delete('/employees/123')
 */
export default apiClient;
