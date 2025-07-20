import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: { startTime: Date };
  }
}

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>();

// Simple cache for GET requests (5 minute TTL)
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Create a unique key for requests
const createRequestKey = (config: any) => {
  const { method, url, params, data } = config;
  return `${method?.toUpperCase()}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
};

// Check if cached response is still valid
const isCacheValid = (timestamp: number) => {
  return Date.now() - timestamp < CACHE_TTL;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  // Performance optimizations
  timeout: 10000, // 10 second timeout
  timeoutErrorMessage: 'Request timed out. Please try again.',
});

// Request interceptor - only add token if not already present
api.interceptors.request.use(
  (config) => {
    // Add request timestamp for performance monitoring
    config.metadata = { startTime: new Date() };
    
    if (config.url?.includes('auth/refresh')) {
      const tokensString = localStorage.getItem('tokens')
      if (tokensString) {
        const tokens = JSON.parse(tokensString)
        config.headers.Authorization = `Bearer ${tokens.refreshToken}`
      }
    } else {
      const tokensString = localStorage.getItem('tokens')
      if (tokensString) {
        const tokens = JSON.parse(tokensString)
        config.headers.Authorization = `Bearer ${tokens.accessToken}`
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for request deduplication
api.interceptors.response.use(
  (response) => {
    // Remove from pending requests on success
    const requestKey = createRequestKey(response.config);
    pendingRequests.delete(requestKey);
    return response;
  },
  (error) => {
    // Remove from pending requests on error
    if (error.config) {
      const requestKey = createRequestKey(error.config);
      pendingRequests.delete(requestKey);
    }
    return Promise.reject(error);
  }
);

// Enhanced request method with deduplication
const originalRequest = api.request.bind(api);
api.request = function<T = any, R = AxiosResponse<T>>(config: AxiosRequestConfig): Promise<R> {
  const requestKey = createRequestKey(config);
  
  // For GET requests, check cache first
  if (config.method?.toUpperCase() === 'GET') {
    const cached = responseCache.get(requestKey);
    if (cached && isCacheValid(cached.timestamp)) {
      console.log(`🚀 API Cache HIT: ${config.url}`);
      return Promise.resolve({
        data: cached.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config as any,
      } as R);
    }
  }
  
  // If there's already a pending request with the same key, return it
  if (pendingRequests.has(requestKey)) {
    console.log(`🔄 API Request Deduplication: ${config.url}`);
    return pendingRequests.get(requestKey) as Promise<R>;
  }
  
  console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
  
  // Create new request and store it
  const requestPromise = originalRequest(config) as Promise<R>;
  pendingRequests.set(requestKey, requestPromise);
  
  // Cache successful GET responses
  if (config.method?.toUpperCase() === 'GET') {
    requestPromise.then((response: any) => {
      console.log(`💾 API Cache SET: ${config.url}`);
      responseCache.set(requestKey, {
        data: response.data,
        timestamp: Date.now(),
      });
    }).catch(() => {
      // Don't cache failed requests
    });
  }
  
  return requestPromise;
};

// Enhanced get method
const originalGet = api.get.bind(api);
api.get = function(url, config) {
  return this.request({ ...config, method: 'GET', url });
};

// Enhanced post method
const originalPost = api.post.bind(api);
api.post = function(url, data, config) {
  return this.request({ ...config, method: 'POST', url, data });
};

// Enhanced put method
const originalPut = api.put.bind(api);
api.put = function(url, data, config) {
  return this.request({ ...config, method: 'PUT', url, data });
};

// Enhanced delete method
const originalDelete = api.delete.bind(api);
api.delete = function(url, config) {
  return this.request({ ...config, method: 'DELETE', url });
};

// Enhanced patch method
const originalPatch = api.patch.bind(api);
api.patch = function(url, data, config) {
  return this.request({ ...config, method: 'PATCH', url, data });
};

// Utility function to clear cache
export const clearApiCache = () => {
  responseCache.clear();
  pendingRequests.clear();
};

// Utility function to clear cache for specific endpoints
export const clearApiCacheForEndpoint = (endpoint: string) => {
  for (const [key] of responseCache) {
    if (key.includes(endpoint)) {
      responseCache.delete(key);
    }
  }
  for (const [key] of pendingRequests) {
    if (key.includes(endpoint)) {
      pendingRequests.delete(key);
    }
  }
};

export default api; 