'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Role, Permission } from '@/types/auth';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role;
  requiredPermission?: Permission | Permission[];
  fallbackUrl?: string;
}

/**
 * A component that restricts access to children based on user role or permissions
 */
export default function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallbackUrl = '/'
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, hasPermission } = useAuth();
  const router = useRouter();
  
  // While auth is loading, show a loading state
  if (isLoading) {
    return <div className="flex justify-center p-8">Checking permissions...</div>;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // Use client-side redirect
    router.push('/login');
    return <div className="flex justify-center p-8">Redirecting to login...</div>;
  }

  // Check role if required
  if (requiredRole && !hasRole(requiredRole)) {
    router.push(fallbackUrl);
    return (
      <div className="flex justify-center p-8">
        You don&apos;t have the required role to access this page. Redirecting...
      </div>
    );
  }

  // Check permission if required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    router.push(fallbackUrl);
    return (
      <div className="flex justify-center p-8">
        You don&apos;t have the required permissions to access this page. Redirecting...
      </div>
    );
  }

  // If all checks pass, render children
  return <>{children}</>;
} 