import axios from 'axios';

// Extend AxiosRequestConfig to include metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: { startTime: Date };
  }
}

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

// Response interceptor for token refresh and performance monitoring
api.interceptors.response.use(
  (response) => {
    // Log performance for slow requests
    const endTime = new Date();
    const duration = endTime.getTime() - (response.config.metadata?.startTime?.getTime() || endTime.getTime());
    if (duration > 2000) { // Log requests taking more than 2 seconds
      console.warn(`Slow API request: ${response.config.url} took ${duration}ms`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const tokensString = localStorage.getItem('tokens');
        if (!tokensString) {
          // Clear any existing tokens and redirect
          localStorage.removeItem('user');
          localStorage.removeItem('tokens');
          delete api.defaults.headers.common['Authorization'];
          window.location.href = '/auth/login';
          return Promise.reject(error);
        }
        
        const tokens = JSON.parse(tokensString);
        const refreshToken = tokens.refreshToken;
        
        if (!refreshToken) {
          // Clear tokens and redirect
          localStorage.removeItem('user');
          localStorage.removeItem('tokens');
          delete api.defaults.headers.common['Authorization'];
          window.location.href = '/auth/login';
          return Promise.reject(error);
        }
        
        // Use a fresh axios instance for refresh to avoid interceptor loops
        const refreshResponse = await axios.post('/api/v1/auth/refresh', { 
          refreshToken 
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000, // Shorter timeout for refresh
        });
        
        const { user, tokens: newTokens } = refreshResponse.data.data;
        
        // Update stored tokens and user
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('tokens', JSON.stringify(newTokens));
        
        // Update the failed request with new token
        originalRequest.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear everything and redirect
        localStorage.removeItem('user');
        localStorage.removeItem('tokens');
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }
    
    // Log error details for debugging
    if (error.response) {
      console.error(`API Error: ${error.response.status} - ${error.response.statusText}`, {
        url: error.config?.url,
        method: error.config?.method,
        data: error.response.data,
      });
    } else if (error.request) {
      console.error('API Request Error: No response received', {
        url: error.config?.url,
        method: error.config?.method,
      });
    } else {
      console.error('API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api; 