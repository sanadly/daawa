export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_ASSIGN_ROLES = 'user:assign_roles',

  // Event Management
  EVENT_CREATE = 'event:create',
  EVENT_READ = 'event:read',
  EVENT_UPDATE = 'event:update',
  EVENT_DELETE = 'event:delete',
  EVENT_PUBLISH = 'event:publish',
  EVENT_ACTIVATE = 'event:activate',
  EVENT_DEACTIVATE = 'event:deactivate',

  // Guest Management
  GUEST_CREATE = 'guest:create',
  GUEST_READ = 'guest:read',
  GUEST_UPDATE = 'guest:update',
  GUEST_DELETE = 'guest:delete',
  GUEST_IMPORT = 'guest:import',
  GUEST_EXPORT = 'guest:export',

  // Check-in Management
  CHECKIN_PERFORM = 'checkin:perform',
  CHECKIN_READ = 'checkin:read',
  CHECKIN_OVERRIDE = 'checkin:override',

  // Analytics & Reporting
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_EXPORT = 'analytics:export',

  // System Administration
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_LOGS = 'system:logs',
  SYSTEM_MONITOR = 'system:monitor',

  // Template Management
  TEMPLATE_CREATE = 'template:create',
  TEMPLATE_READ = 'template:read',
  TEMPLATE_UPDATE = 'template:update',
  TEMPLATE_DELETE = 'template:delete',
}

export type PermissionMap = {
  [key in UserRole]: Permission[];
};

import { UserRole } from '../../database/entities/user.entity';

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
  
  [UserRole.COMPANY_ORGANIZER]: [
    // Full event and guest management for companies
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
    Permission.CHECKIN_PERFORM,
    Permission.CHECKIN_READ,
    Permission.ANALYTICS_READ,
    Permission.ANALYTICS_EXPORT,
    Permission.TEMPLATE_CREATE,
    Permission.TEMPLATE_READ,
    Permission.TEMPLATE_UPDATE,
    Permission.TEMPLATE_DELETE,
  ],
  [UserRole.INDIVIDUAL_ORGANIZER]: [
    // Event and guest management for individuals
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
    Permission.CHECKIN_PERFORM,
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

export const hasPermission = (userRole: UserRole, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
};

export const getUserPermissions = (userRole: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[userRole] ?? [];
}; 