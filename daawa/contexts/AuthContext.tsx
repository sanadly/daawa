'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthTokens, Permission, Role } from '@/types/auth';
import { getMyPermissions } from '@/services/apiRoleManagement';

// Key for localStorage
const TOKEN_KEY = 'daawa_auth_tokens';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: Permission[];
  login: (userData: User, tokens: AuthTokens) => void;
  logout: () => void;
  hasPermission: (permission: Permission | Permission[]) => boolean;
  hasRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [permissions, setPermissions] = useState<Permission[]>([]);

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
          
          // Fetch user permissions when authenticated
          try {
            const myPermissions = await getMyPermissions();
            setPermissions(myPermissions);
          } catch (error) {
            console.error('Failed to load user permissions', error);
          }
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

  const login = async (userData: User, tokens: AuthTokens) => {
    console.log('AuthContext: login called with userData:', userData, 'tokens:', tokens);
    setUser(userData);
    setAccessToken(tokens.access_token);
    if (tokens.refresh_token) {
      setRefreshToken(tokens.refresh_token);
    }
    setIsAuthenticated(true);
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    console.log('AuthContext: state after login - isAuthenticated:', true, 'user:', userData);
    
    // Fetch user permissions after login
    try {
      const myPermissions = await getMyPermissions();
      setPermissions(myPermissions);
    } catch (error) {
      console.error('Failed to load user permissions after login', error);
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
    setPermissions([]);
    localStorage.removeItem(TOKEN_KEY);
    // TODO: Call backend logout endpoint to invalidate refresh token if necessary
    // await logoutUserApi(); 
  };
  
  // Check if user has a specific permission or any from an array of permissions
  const hasPermission = (permissionCheck: Permission | Permission[]): boolean => {
    if (!permissions.length) return false;
    
    if (Array.isArray(permissionCheck)) {
      return permissionCheck.some(p => permissions.includes(p));
    }
    
    return permissions.includes(permissionCheck);
  };
  
  // Check if user has a specific role
  const hasRole = (roleCheck: Role): boolean => {
    if (!user) return false;
    return user.role === roleCheck;
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        accessToken, 
        refreshToken, 
        isAuthenticated, 
        isLoading, 
        permissions,
        login, 
        logout,
        hasPermission,
        hasRole
      }}
    >
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