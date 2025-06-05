'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
// import { useRouter, usePathname } from 'next/navigation'; // Removed unused imports
import { User, AuthTokens } from '@/types/auth';
import { getMyProfile } from '@/services/apiRoleManagement';
import { loginUser as apiLoginUser, LoginCredentials } from '@/services/apiAuth'; // Import real login function
import { Role } from '@/types/auth';

// Key for localStorage
const TOKEN_KEY = 'daawa_auth_tokens';

// Export these types
export type Permission = string;

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: Permission[];
  login: (email: string, password: string, bypassAuth?: boolean) => Promise<void>;
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
    console.log('[AuthContext] Attempting to load/resync user from storage.'); // Removed: Awaiting API initialization...
    setIsLoading(true); // Set loading true during resync
    // await apiInitializationPromise; // Removed: API is now initialized synchronously
    // console.log('[AuthContext] API initialization complete. Proceeding to load/resync user from storage.');

    try {
      const storedTokens = localStorage.getItem(TOKEN_KEY);
      if (storedTokens) {
        const parsedTokens: AuthTokens = JSON.parse(storedTokens);
        setAccessToken(parsedTokens.access_token);
        if (parsedTokens.refresh_token) {
          setRefreshToken(parsedTokens.refresh_token);
        }
        // Set isAuthenticated to true optimistically, it will be confirmed by profile fetch
        setIsAuthenticated(true); 
        console.log('[AuthContext] Tokens loaded, isAuthenticated tentatively true. Fetching user profile...');
        
        try {
          const userProfile = await getMyProfile();
          setUser(userProfile);
          setIsAuthenticated(true);
          console.log('[AuthContext] User profile fetched successfully:', userProfile);
          
          // For now, clear specific permissions or derive them if needed
          // If your app uses granular permissions extensively, you'll need a mapping from role to permissions here.
          // Example: if (userProfile.role === Role.ADMIN) setPermissions(['MANAGE_USERS', ...]);
          setPermissions([]);

        } catch (error) {
          console.error('[AuthContext] Failed to load user profile during load/resync', error);
          // If profile fetch fails, user is not truly authenticated with the backend.
          setUser(null);
          setAccessToken(null);
          setRefreshToken(null);
          setIsAuthenticated(false); 
          setPermissions([]);
          localStorage.removeItem(TOKEN_KEY); // Remove invalid/stale token
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

  const login = async (email: string, password: string, bypassAuth = false) => {
    console.log('[AuthContext] login called.');
    setIsLoading(true);
    
    try {
      if (bypassAuth && process.env.NODE_ENV === 'development') {
        // Development bypass - mock successful login
        console.log('[AuthContext] Using development bypass login');
        
        const mockUser: User = {
          id: 1,
          email: email,
          role: Role.ADMIN,
          username: email.split('@')[0]
        };
        const mockTokens: AuthTokens = {
          access_token: 'dev-mock-token-' + Date.now(),
          refresh_token: 'dev-mock-refresh-token-' + Date.now()
        };
        
        setUser(mockUser);
        setAccessToken(mockTokens.access_token);
        setRefreshToken(mockTokens.refresh_token);
        setIsAuthenticated(true);
        localStorage.setItem(TOKEN_KEY, JSON.stringify(mockTokens));
        setPermissions(['VIEW_DASHBOARD', 'MANAGE_USERS', 'MANAGE_ROLES', 'MANAGE_EVENTS', 'ADMIN_ACCESS']);
        console.log('[AuthContext] Dev bypass login successful.');
      } else {
        // Real authentication logic using apiLoginUser
        if (!email || !password) {
          throw new Error('Email and password are required');
        }
        
        console.log(`[AuthContext] Attempting real login for ${email}`);
        const loginCredentials: LoginCredentials = { email, password };
        const { tokens: realTokens, user: realUser } = await apiLoginUser(loginCredentials);
        
        setUser(realUser);
        setAccessToken(realTokens.access_token);
        setRefreshToken(realTokens.refresh_token);
        setIsAuthenticated(true);
        localStorage.setItem(TOKEN_KEY, JSON.stringify(realTokens));
        
        // TODO: Fetch actual permissions for the user based on their role from the backend
        // For now, setting basic permissions or deriving from role if simple
        if (realUser.role === Role.ADMIN) {
          setPermissions(['VIEW_DASHBOARD', 'MANAGE_USERS', 'MANAGE_ROLES', 'MANAGE_EVENTS', 'ADMIN_ACCESS']);
        } else {
          setPermissions(['VIEW_DASHBOARD']); // Basic permissions for other roles
        }
        console.log('[AuthContext] Real login successful for user:', realUser);
      }
    } catch (error) {
      console.error('[AuthContext] Login failed:', error);
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setIsAuthenticated(false);
      setPermissions([]);
      localStorage.removeItem(TOKEN_KEY);
      throw error;
    } finally {
      setIsLoading(false);
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