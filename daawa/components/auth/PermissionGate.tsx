'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Role, Permission } from '@/types/auth';

interface PermissionGateProps {
  children: React.ReactNode;
  requiredRole?: Role;
  requiredPermission?: Permission | Permission[];
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children based on user roles or permissions
 */
export default function PermissionGate({
  children,
  requiredRole,
  requiredPermission,
  fallback = null
}: PermissionGateProps) {
  const { isAuthenticated, hasRole, hasPermission } = useAuth();

  // If not authenticated, don't render children
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Check role if required
  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  // Check permission if required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <>{fallback}</>;
  }

  // All checks passed, render children
  return <>{children}</>;
} 