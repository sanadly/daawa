'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, AuthTokens, Permission, Role } from '@/types/auth';
import { getMyPermissions } from '@/services/apiRoleManagement';
import { apiInitializationPromise } from '@/services/api';

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
  reSyncAuthFromStorage: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  // Define loadUserFromStorage outside useEffect so it can be reused
  const loadUserFromStorage = useCallback(async () => {
    console.log('[AuthContext] Attempting to load/resync user from storage. Awaiting API initialization...');
    setIsLoading(true); // Set loading true during resync
    await apiInitializationPromise;
    console.log('[AuthContext] API initialization complete. Proceeding to load/resync user from storage.');

    try {
      const storedTokens = localStorage.getItem(TOKEN_KEY);
      if (storedTokens) {
        const parsedTokens: AuthTokens = JSON.parse(storedTokens);
        setAccessToken(parsedTokens.access_token);
        if (parsedTokens.refresh_token) {
          setRefreshToken(parsedTokens.refresh_token);
        }
        // We need to set isAuthenticated to true here BEFORE fetching permissions
        // so that getMyPermissions uses the new token if the API client inside it relies on AuthContext for the token.
        // However, getMyPermissions likely gets the token directly or via an interceptor that reads from localStorage or the state.
        // For now, let's assume getMyPermissions is robust enough.
        setIsAuthenticated(true); 
        console.log('[AuthContext] Tokens loaded, isAuthenticated set to true. Fetching permissions...');
        
        try {
          const myPermissions = await getMyPermissions();
          setPermissions(myPermissions);
          // Assuming getMyPermissions also fetches user details or we can derive user from token if needed
          // For dev bypass, we might not have full user object, only what inject-auth.js provides
          // This part might need adjustment if `user` state needs to be populated from token during resync
          console.log('[AuthContext] Permissions fetched successfully:', myPermissions);
        } catch (error) {
          console.error('[AuthContext] Failed to load user permissions during load/resync', error);
          // Potentially logout or clear auth state if permissions are critical
          // For a resync, if permissions fail, we might want to revert isAuthenticated
          // setIsAuthenticated(false); 
          // setPermissions([]);
        }
      } else {
        console.log('[AuthContext] No tokens found in storage during load/resync. Clearing auth state.');
        // Clear auth state if no tokens
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
        setIsAuthenticated(false);
        setPermissions([]);
      }
    } catch (error) {
      console.error('[AuthContext] Failed to load/resync user from storage or parse tokens', error);
      localStorage.removeItem(TOKEN_KEY); // Clean up potentially corrupted token
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setIsAuthenticated(false);
      setPermissions([]);
    }
    setIsLoading(false);
    console.log('[AuthContext] Load/resync process complete. isLoading set to false.');
  }, []); // useCallback dependencies

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]); // useEffect now depends on the memoized loadUserFromStorage

  const login = async (userData: User, tokens: AuthTokens) => {
    console.log('[AuthContext] login called. Awaiting API initialization...');
    await apiInitializationPromise;
    console.log('[AuthContext] API initialization complete. Proceeding with login.');

    setUser(userData); // Set user object from login
    setAccessToken(tokens.access_token);
    if (tokens.refresh_token) {
      setRefreshToken(tokens.refresh_token);
    }
    setIsAuthenticated(true);
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    console.log('[AuthContext] User and tokens set, isAuthenticated: true. Fetching permissions...');
    
    try {
      const myPermissions = await getMyPermissions();
      setPermissions(myPermissions);
      console.log('[AuthContext] Permissions fetched successfully after login:', myPermissions);
    } catch (error) {
      console.error('[AuthContext] Failed to load user permissions after login', error);
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
    setPermissions([]);
    localStorage.removeItem(TOKEN_KEY);
    console.log('[AuthContext] User logged out, tokens removed from storage.');
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
        hasRole,
        reSyncAuthFromStorage: loadUserFromStorage
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