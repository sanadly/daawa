'use client';

import { ReactNode } from 'react';
import { useAuth } from '../auth-context';
import { Permission, UserRole } from '../types';
import { UnauthorizedFallback } from './UnauthorizedFallback';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAll?: boolean; // If true, user must have ALL permissions; if false, ANY permission
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

export const ProtectedRoute = ({
  children,
  requireAuth = true,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = true,
  fallback,
  loadingFallback,
}: ProtectedRouteProps) => {
  const { 
    isAuthenticated, 
    isLoading, 
    user,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  } = useAuth();

  // Show loading spinner while checking auth
  if (isLoading) {
    return loadingFallback || <LoadingSpinner />;
  }

  // Check if authentication is required
  if (requireAuth && !isAuthenticated) {
    return fallback || <UnauthorizedFallback reason="login-required" />;
  }

  // Check role requirements
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRole = hasAnyRole(requiredRoles);
    if (!hasRequiredRole) {
      return fallback || <UnauthorizedFallback reason="insufficient-role" userRole={user.role} requiredRoles={requiredRoles} />;
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
      
    if (!hasRequiredPermissions) {
      return fallback || <UnauthorizedFallback reason="insufficient-permissions" requiredPermissions={requiredPermissions} />;
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}; 