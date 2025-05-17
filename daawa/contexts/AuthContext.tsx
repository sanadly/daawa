'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type UserData, type AuthTokens } from '@/services/apiAuth'; // Assuming AuthTokens is exported

// Key for localStorage
const TOKEN_KEY = 'daawa_auth_tokens';

interface AuthContextType {
  user: UserData | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: UserData, tokens: AuthTokens) => void;
  logout: () => void;
  // setTokens: (tokens: AuthTokens) => void; // Could be useful for token refresh
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedTokens = localStorage.getItem(TOKEN_KEY);
        if (storedTokens) {
          const parsedTokens: AuthTokens = JSON.parse(storedTokens);
          // TODO: Here you would typically validate the accessToken with the backend
          // or use the refreshToken to get a new accessToken if the current one is expired.
          // For now, if tokens exist, we'll assume they are valid and try to fetch user profile.
          // This part will need a /profile endpoint on the backend.
          // For demonstration, we'll just set the tokens and simulate user loading.

          setAccessToken(parsedTokens.access_token);
          if (parsedTokens.refresh_token) {
            setRefreshToken(parsedTokens.refresh_token);
          }

          // Placeholder: Fetch user profile using the loaded access token
          // const userProfile = await getProfile(parsedTokens.access_token);
          // setUser(userProfile);
          // setIsAuthenticated(true);
          
          // TEMPORARY: If tokens are found, assume authenticated for now, but no user data yet
          // The actual user data should come from a profile call or be decoded from JWT.
          console.log('Tokens loaded from storage. User data needs to be fetched.');
          // To fully re-authenticate, we'd need a way to get user data from the token.
          // For now, this will just make isAuthenticated true if tokens are present.
          // This is a simplification and should be improved.
          setIsAuthenticated(true); // Simplified: if tokens exist, consider authenticated
        }
      } catch (error) {
        console.error('Failed to load user from storage', error);
        // Clear tokens if parsing fails or any other error
        localStorage.removeItem(TOKEN_KEY);
      }
      setIsLoading(false);
    };

    loadUserFromStorage();
  }, []);

  const login = (userData: UserData, tokens: AuthTokens) => {
    console.log('AuthContext: login called with userData:', userData, 'tokens:', tokens);
    setUser(userData);
    setAccessToken(tokens.access_token);
    if (tokens.refresh_token) {
      setRefreshToken(tokens.refresh_token);
    }
    setIsAuthenticated(true);
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    console.log('AuthContext: state after login - isAuthenticated:', true, 'user:', userData);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem(TOKEN_KEY);
    // TODO: Call backend logout endpoint to invalidate refresh token if necessary
    // await logoutUserApi(); 
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, refreshToken, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 