// daawa/services/apiAuth.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'; // Ensure your backend port is correct
const TOKEN_STORAGE_KEY = 'daawa_auth_tokens'; // Same key as in AuthContext

// Define types for request bodies and responses based on your DTOs and backend responses
// Example for Login (adjust based on your CreateUserDto, LoginUserDto, and backend return types)
export interface LoginCredentials {
  username?: string; // Made username optional
  password?: string;
  email?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface UserData {
  id: number;
  username: string;
  email?: string;
  // other user fields...
}

// Redefined RegisterData to be more explicit for registration requirements
export interface RegisterData {
  username: string;
  email: string;
  password?: string; // Changed to optional, will be made required in RegisterForm component state
}

// Generic fetch wrapper (optional, but good for setting headers, error handling)
export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  // Initialize headers as Record<string, string> for easier manipulation
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) };
  
  const storedTokensItem = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
  if (storedTokensItem) {
    try {
      const storedTokens: AuthTokens = JSON.parse(storedTokensItem);
      if (storedTokens.access_token) {
        headers['Authorization'] = `Bearer ${storedTokens.access_token}`;
      }
    } catch (parseError) { // Changed variable name to avoid conflict
      console.error('Failed to parse tokens from localStorage', parseError);
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: new Headers(headers), // Convert back to Headers object for fetch
  });

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch { // Removed unused error variable 'e'
      errorData = { message: response.statusText || 'Request failed with status: ' + response.status };
    }
    throw new Error(errorData.message || 'API request failed');
  }

  // Handle cases where response might be empty (e.g., 204 No Content)
  if (response.status === 204) {
    return null; // Or an appropriate representation for no content
  }

  return response.json();
}

export const loginUser = async (credentials: LoginCredentials): Promise<{ tokens: AuthTokens; user: UserData }> => {
  const responseData = await fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  // Backend returns { access_token, refresh_token, user }
  // Frontend expects { tokens: { access_token, refresh_token }, user }
  return {
    tokens: {
      access_token: responseData.access_token,
      refresh_token: responseData.refresh_token,
    },
    user: responseData.user,
  };
};

export const registerUser = async (userData: RegisterData): Promise<UserData> => {
  // Backend for register returns: { id, username, email, isEmailVerified, emailVerificationToken, createdAt, updatedAt }
  // This matches UserData if we consider emailVerificationToken etc. as not part of the core UserData for the context.
  return fetchApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const logoutUser = async (/* pass token if needed by backend */): Promise<null> => {
  // Backend for logout (if it invalidates session/token) might expect a token.
  // The Authorization header will be added automatically by fetchApi if a token exists.
  // It returns { message: 'Logout successful' } which can be a 200 or 204.
  // If 204, fetchApi will return null.
  return fetchApi('/auth/logout', {
    method: 'POST',
    // body: JSON.stringify({ refreshToken: '...' }) // if needed
  });
};

export const refreshToken = async (currentRefreshToken: string): Promise<AuthTokens> => {
  // The /auth/refresh endpoint specifically needs the refresh token in its body or header,
  // not necessarily the access token. Current backend expects it in Authorization header.
  // If it expects refresh token in body, we adjust.
  // Let's assume for now it still uses the Authorization Bearer token for the refresh token itself as per your current backend code.
  // This might need adjustment based on how your backend /auth/refresh is secured.
  // Typically, refresh token is sent in the body.
  return fetchApi('/auth/refresh', {
    method: 'POST',
    // If refresh token should be in body:
    // body: JSON.stringify({ refreshToken: currentRefreshToken }),
    // headers: { 'Content-Type': 'application/json' } // Remove Auth header if it's not for access token
    // If your backend expects the refresh token itself as a Bearer token for this specific endpoint:
     headers: { 'Authorization': `Bearer ${currentRefreshToken}` }
  });
};

export const resendVerificationEmail = async (email: string): Promise<{ message: string }> => {
  return fetchApi('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const verifyEmailTokenOnBackend = async (token: string): Promise<{ message: string }> => {
  // The fetchApi function should handle constructing the full URL
  // and not require a body for GET requests.
  return fetchApi(`/auth/verify-email?token=${token}`, { method: 'GET' });
};

// You would also add functions for:
// - verifyEmail (though this is usually a GET request handled by navigating to a link)
// - passwordResetRequest
// - passwordResetConfirm

// daawa/services/apiAuth.ts 