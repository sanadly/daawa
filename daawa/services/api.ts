import axios from 'axios';

// Function to get the backend port
async function getBackendBaseUrl(): Promise<string> {
  console.log('[api.ts] getBackendBaseUrl called');
  // First check environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    console.log('[api.ts] Using NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // If in browser, attempt to fetch from a port info endpoint
  if (typeof window !== 'undefined') {
    try {
      console.log('[api.ts] Attempting to fetch /api/backend-port');
      // Try to fetch from our backend discovery endpoint
      const response = await fetch('/api/backend-port');
      if (response.ok) {
        const data = await response.json();
        if (data.baseUrl) {
          console.log('[api.ts] Fetched baseUrl from /api/backend-port:', data.baseUrl);
          return data.baseUrl;
        }
      } else {
        console.log('[api.ts] /api/backend-port call not ok, status:', response.status);
      }
    } catch (error) {
      console.warn('[api.ts] Failed to fetch backend port from /api/backend-port:', error);
      // Continue to fallback
    }
  }

  // Fallback to default port
  const fallbackUrl = 'http://localhost:3006';
  console.log('[api.ts] Falling back to default baseURL:', fallbackUrl);
  return fallbackUrl;
}

// Create the axios instance with default config
console.log('[api.ts] Creating axios instance (api constant)');
export const api = axios.create({
  baseURL: 'http://localhost:3006', // This will be dynamically updated
  headers: {
    'Content-Type': 'application/json',
  },
});
console.log('[api.ts] Initial api.defaults.baseURL:', api.defaults.baseURL);

// Initialize the API with the correct base URL
async function initializeApi(): Promise<void> {
  console.log('[api.ts] initializeApi function started');
  try {
    const baseURL = await getBackendBaseUrl();
    console.log('[api.ts] initializeApi: Before setting api.defaults.baseURL. Current value:', api.defaults.baseURL, 'Will set to:', baseURL);
    api.defaults.baseURL = baseURL;
    console.log(`[api.ts] API initialized with baseURL (api.defaults.baseURL): ${api.defaults.baseURL}`);
  } catch (error) {
    console.error('[api.ts] Failed to initialize API with dynamic baseURL:', error);
    console.log('[api.ts] API will use the hardcoded default baseURL:', api.defaults.baseURL);
    // Keep the default baseURL
  }
}

// DO NOT self-invoke here anymore.
// console.log('[api.ts] Calling initializeApi()');
// initializeApi();
// console.log('[api.ts] initializeApi() call initiated. Note: it is async.');

// Instead, invoke it and export the promise so other modules can await it.
console.log('[api.ts] Creating and exporting apiInitializationPromise');
export const apiInitializationPromise = initializeApi();
console.log('[api.ts] apiInitializationPromise created. Other modules can now import and await it.');

// Export the interceptor setup function
export function setupApiInterceptors(
  onUnauthorized: () => void,
  getAuthToken: () => string | null
): void {
  // Request interceptor
  api.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Call the onUnauthorized callback
        onUnauthorized();
      }
      return Promise.reject(error);
    }
  );
}

export default api;