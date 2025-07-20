import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - only add token if not already present
api.interceptors.request.use(
  (config) => {
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

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
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
        const refreshResponse = await axios.post('/api/auth/refresh', { 
          refreshToken 
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
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
    
    return Promise.reject(error);
  }
);

export default api; 