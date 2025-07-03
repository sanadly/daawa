import { UserRole, Permission } from './types';

export type PermissionMap = {
  [key in UserRole]: Permission[];
};

export const ROLE_PERMISSIONS: PermissionMap = {
  [UserRole.ADMIN]: [
    // Full system access
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_ASSIGN_ROLES,
    Permission.EVENT_CREATE,
    Permission.EVENT_READ,
    Permission.EVENT_UPDATE,
    Permission.EVENT_DELETE,
    Permission.EVENT_PUBLISH,
    Permission.EVENT_ACTIVATE,
    Permission.EVENT_DEACTIVATE,
    Permission.GUEST_CREATE,
    Permission.GUEST_READ,
    Permission.GUEST_UPDATE,
    Permission.GUEST_DELETE,
    Permission.GUEST_IMPORT,
    Permission.GUEST_EXPORT,
    Permission.CHECKIN_PERFORM,
    Permission.CHECKIN_READ,
    Permission.CHECKIN_OVERRIDE,
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_EXPORT,
    Permission.SYSTEM_CONFIG,
    Permission.SYSTEM_LOGS,
    Permission.SYSTEM_MONITOR,
    Permission.TEMPLATE_CREATE,
    Permission.TEMPLATE_READ,
    Permission.TEMPLATE_UPDATE,
    Permission.TEMPLATE_DELETE,
  ],
  [UserRole.ORGANIZER]: [
    // Event and guest management
    Permission.EVENT_CREATE,
    Permission.EVENT_READ,
    Permission.EVENT_UPDATE,
    Permission.EVENT_DELETE,
    Permission.EVENT_PUBLISH,
    Permission.GUEST_CREATE,
    Permission.GUEST_READ,
    Permission.GUEST_UPDATE,
    Permission.GUEST_DELETE,
    Permission.GUEST_IMPORT,
    Permission.GUEST_EXPORT,
    Permission.CHECKIN_READ,
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_EXPORT,
    Permission.TEMPLATE_CREATE,
    Permission.TEMPLATE_READ,
    Permission.TEMPLATE_UPDATE,
    Permission.TEMPLATE_DELETE,
  ],
  [UserRole.STAFF]: [
    // Check-in and basic guest operations
    Permission.GUEST_READ,
    Permission.CHECKIN_PERFORM,
    Permission.CHECKIN_READ,
    Permission.TEMPLATE_READ,
  ],
};

/**
 * Check if a user role has a specific permission
 */
export const hasPermission = (userRole: UserRole | null, permission: Permission): boolean => {
  if (!userRole) return false;
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
};

/**
 * Get all permissions for a user role
 */
export const getUserPermissions = (userRole: UserRole | null): Permission[] => {
  if (!userRole) return [];
  return ROLE_PERMISSIONS[userRole] ?? [];
};

/**
 * Check if a user role has any of the specified permissions
 */
export const hasAnyPermission = (userRole: UserRole | null, permissions: Permission[]): boolean => {
  if (!userRole || permissions.length === 0) return false;
  return permissions.some(permission => hasPermission(userRole, permission));
};

/**
 * Check if a user role has all of the specified permissions
 */
export const hasAllPermissions = (userRole: UserRole | null, permissions: Permission[]): boolean => {
  if (!userRole || permissions.length === 0) return false;
  return permissions.every(permission => hasPermission(userRole, permission));
};

/**
 * Get role display information
 */
export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames = {
    [UserRole.ADMIN]: 'Administrator',
    [UserRole.ORGANIZER]: 'Event Organizer',
    [UserRole.STAFF]: 'Staff Member',
  };
  return roleNames[role];
};

/**
 * Get role color for UI display
 */
export const getRoleColor = (role: UserRole): string => {
  const roleColors = {
    [UserRole.ADMIN]: 'bg-red-100 text-red-800',
    [UserRole.ORGANIZER]: 'bg-blue-100 text-blue-800',
    [UserRole.STAFF]: 'bg-green-100 text-green-800',
  };
  return roleColors[role];
};

/**
 * Check if user can assign a specific role
 */
export const canAssignRole = (
  assignerRole: UserRole | null,
  targetRole: UserRole,
): boolean => {
  if (!assignerRole) return false;
  
  // Only admins can assign admin roles
  if (targetRole === UserRole.ADMIN && assignerRole !== UserRole.ADMIN) {
    return false;
  }

  // Admins can assign any role
  if (assignerRole === UserRole.ADMIN) {
    return true;
  }

  // Organizers can assign staff roles only
  if (assignerRole === UserRole.ORGANIZER && targetRole === UserRole.STAFF) {
    return true;
  }

  return false;
}; 