'use client';

import { ReactNode } from 'react';
import { useAuth } from '../auth-context';
import { Permission, UserRole } from '../types';

interface RoleGuardProps {
  children: ReactNode;
  roles?: UserRole[];
  permissions?: Permission[];
  requireAll?: boolean; // If true, user must have ALL permissions; if false, ANY permission
  fallback?: ReactNode;
  inverse?: boolean; // If true, hide content when user HAS the roles/permissions
}

export const RoleGuard = ({
  children,
  roles = [],
  permissions = [],
  requireAll = true,
  fallback = null,
  inverse = false,
}: RoleGuardProps) => {
  const { 
    user,
    hasAnyRole,
    hasAnyPermission,
    hasAllPermissions,
  } = useAuth();

  // If no roles or permissions specified, render children by default
  if (roles.length === 0 && permissions.length === 0) {
    return <>{children}</>;
  }

  let hasAccess = true;

  // Check role requirements
  if (roles.length > 0) {
    hasAccess = hasAnyRole(roles);
  }

  // Check permission requirements (AND with role check if both are specified)
  if (permissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    // If both roles and permissions are specified, user must satisfy both
    if (roles.length > 0) {
      hasAccess = hasAccess && hasRequiredPermissions;
    } else {
      hasAccess = hasRequiredPermissions;
    }
  }

  // Handle inverse logic
  if (inverse) {
    hasAccess = !hasAccess;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Convenience components for common use cases
export const AdminOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard roles={[UserRole.ADMIN]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const OrganizerOrAdmin = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard roles={[UserRole.ADMIN, UserRole.ORGANIZER]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const StaffOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard roles={[UserRole.STAFF]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const CanCreateEvents = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard permissions={[Permission.EVENT_CREATE]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const CanManageUsers = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard permissions={[Permission.USER_ASSIGN_ROLES]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const CanPerformCheckin = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard permissions={[Permission.CHECKIN_PERFORM]} fallback={fallback}>
    {children}
  </RoleGuard>
); 