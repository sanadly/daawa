import axios, { AxiosError } from 'axios';
import { getAuthToken, clearAuthTokens } from './authToken';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3001', // Corrected to actual backend port from logs
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug the initial configuration
console.log('[api.ts] Creating axios instance (api constant)');
console.log('[api.ts] Initial api.defaults.baseURL:', api.defaults.baseURL);

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token to headers for each request
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('[api.ts] Token added to request headers by interceptor.');
    } else {
      console.log('[api.ts] No token found by interceptor, request sent without Authorization header.');
    }
    return config;
  },
  (error) => {
    // Handle request error
    console.error('API request error (interceptor):', error);
    return Promise.reject(error);
  }
);

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    // Process successful responses
    return response;
  },
  (error: AxiosError) => {
    // Handle unauthorized errors
    if (error.response?.status === 401) {
      console.log('[api.ts] 401 Unauthorized error intercepted. Clearing tokens and redirecting to login.');
      clearAuthTokens();
      
      if (typeof window !== 'undefined' && 
          !window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/reset-password')) {
        window.location.href = '/login';
      }
    }
    // It's important to reject the promise so that the calling code's catch block is executed
    return Promise.reject(error);
  }
);

export { api }; // Removed apiInitializationPromise and the local fetchApi wrapper