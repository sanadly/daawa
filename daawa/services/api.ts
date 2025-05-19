import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getAuthToken, clearAuthTokens } from './authToken';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3000', // Directly connect to port 3000
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Debug the initial configuration
console.log('[api.ts] Creating axios instance (api constant)');
console.log('[api.ts] Initial api.defaults.baseURL:', api.defaults.baseURL);

// Define function for initializing the API with the correct backend port
async function initializeApi(): Promise<void> {
  console.log('[api.ts] initializeApi function started');
  
  // We're now using a fixed port 3006 so we don't need to fetch it dynamically
  
  // Set authorization header for initial requests
  const token = getAuthToken();
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  console.log('[api.ts] API initialized with baseURL (api.defaults.baseURL):', api.defaults.baseURL);
}

// Create a promise that indicates when the API is initialized
console.log('[api.ts] Creating and exporting apiInitializationPromise');
const apiInitializationPromise = initializeApi();
console.log('[api.ts] apiInitializationPromise created. Other modules can now import and await it.');

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token to headers for each request
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle request error
    console.error('API request error:', error);
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
      // Clear tokens on auth error
      clearAuthTokens();
      
      // If not on login or auth pages, redirect to login
      if (typeof window !== 'undefined' && 
          !window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/reset-password')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper function for making API requests with proper initialization
export async function fetchApi<T = unknown>(
  url: string,
  options: AxiosRequestConfig = {}
): Promise<T> {
  // Wait for API to be initialized before making requests
  await apiInitializationPromise;
  
  try {
    const response: AxiosResponse<T> = await api.request({
      url,
      ...options,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Extract error details from response
      const errorMessage = error.response.data?.message || error.message;
      throw new Error(errorMessage);
    }
    throw error;
  }
}

export { api, apiInitializationPromise };