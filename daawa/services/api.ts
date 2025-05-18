import axios from 'axios';

// Create axios instance with baseURL
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to add authorization headers
api.interceptors.request.use((config) => {
  const tokenData = localStorage.getItem('daawa_auth_tokens');
  if (tokenData) {
    const { access_token } = JSON.parse(tokenData);
    if (access_token) {
      config.headers['Authorization'] = `Bearer ${access_token}`;
    }
  }
  return config;
});

// Handle response errors (e.g., token refresh when 401 is received)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token refresh logic here if needed
    // if (error.response?.status === 401 && !originalRequest._retry) {
    //   originalRequest._retry = true;
    //   // Implement token refresh logic
    //   // return api(originalRequest);
    // }
    
    return Promise.reject(error);
  }
);