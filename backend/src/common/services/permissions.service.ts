import { Injectable } from '@nestjs/common';
import { Role } from '../decorators/roles.decorator';
import { Permission } from '../decorators/permissions.decorator';

// Interface for defining permission groups
export interface PermissionGroup {
  name: string;
  permissions: Permission[];
}

@Injectable()
export class PermissionsService {
  // Define permission groups for easier management and reuse
  private readonly permissionGroups: Record<string, Permission[]> = {
    eventBasic: [Permission.VIEW_EVENTS],
    eventManagement: [
      Permission.MANAGE_EVENTS,
      Permission.CREATE_EVENT,
      Permission.UPDATE_EVENT,
      Permission.DELETE_EVENT,
    ],
    attendeeManagement: [
      Permission.MANAGE_ATTENDEES,
      Permission.VIEW_ATTENDEES,
      Permission.CHECK_IN_ATTENDEE,
    ],
    analytics: [Permission.VIEW_ANALYTICS, Permission.VIEW_REPORTS],
    adminCore: [
      Permission.MANAGE_USERS,
      Permission.CONFIGURE_SYSTEM,
      Permission.VIEW_LOGS,
    ],
    supportTicket: [
      Permission.CREATE_SUPPORT_TICKET,
      Permission.VIEW_SUPPORT_TICKETS,
      Permission.UPDATE_SUPPORT_TICKET,
      Permission.DELETE_SUPPORT_TICKET,
    ],
  };

  // Define which roles have which permissions with support for permission groups
  private readonly rolePermissionsMap: Map<Role, Permission[]> = new Map([
    [
      Role.ADMIN,
      [
        // Admin-specific permissions (including all permission groups)
        ...this.permissionGroups.adminCore,
        ...this.permissionGroups.eventManagement,
        ...this.permissionGroups.attendeeManagement,
        ...this.permissionGroups.analytics,
        ...this.permissionGroups.supportTicket,
        Permission.MANAGE_STAFF,
        Permission.MANAGE_TASKS,
        Permission.SEND_NOTIFICATIONS,
      ],
    ],
    [
      Role.ORGANIZER,
      [
        // Organizer-specific permissions
        ...this.permissionGroups.eventManagement,
        ...this.permissionGroups.attendeeManagement,
        ...this.permissionGroups.analytics,
        Permission.MANAGE_STAFF,
        Permission.READ_PROFILE,
        Permission.UPDATE_PROFILE,
        Permission.SEND_NOTIFICATIONS,
      ],
    ],
    [
      Role.STAFF,
      [
        // Staff-specific permissions
        ...this.permissionGroups.eventBasic,
        Permission.MANAGE_TASKS,
        Permission.VIEW_ATTENDEES,
        Permission.CHECK_IN_ATTENDEE,
        Permission.READ_PROFILE,
        Permission.CREATE_SUPPORT_TICKET,
      ],
    ],
    [
      Role.USER,
      [
        // Regular users with minimal permissions
        Permission.READ_PROFILE,
        Permission.UPDATE_PROFILE,
        Permission.CREATE_SUPPORT_TICKET,
      ],
    ],
  ]);

  /**
   * Get all permissions for a specific role
   */
  getPermissionsForRole(role: Role): Permission[] {
    return this.rolePermissionsMap.get(role) || [];
  }

  /**
   * Get all permissions for a group of roles
   */
  getAllPermissionsForRoles(roles: Role[]): Permission[] {
    const allPermissions = roles.flatMap((role) => 
      this.getPermissionsForRole(role),
    );
    return [...new Set(allPermissions)]; // Remove duplicates
  }

  /**
   * Check if user has all specified permissions
   */
  hasPermission(userRoles: Role[], requiredPermissions: Permission[]): boolean {
    const userPermissions = this.getAllPermissionsForRoles(userRoles);
    return requiredPermissions.every((permission) => 
      userPermissions.includes(permission),
    );
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(userRoles: Role[], permissions: Permission[]): boolean {
    const userPermissions = this.getAllPermissionsForRoles(userRoles);
    return permissions.some((permission) => 
      userPermissions.includes(permission),
    );
  }

  /**
   * Check if user has permissions for a specific permission group
   */
  hasPermissionGroup(userRoles: Role[], groupName: string): boolean {
    const groupPermissions = this.permissionGroups[groupName];
    if (!groupPermissions) return false;
    return this.hasPermission(userRoles, groupPermissions);
  }

  /**
   * Check if user has permissions to access a resource they own
   * This handles cases where users have elevated permissions for their own resources
   */
  canAccessOwnedResource(
    userRoles: Role[],
    resourceOwnerId: number | string,
    userId: number | string,
    ownerPermission: Permission,
    adminPermission: Permission,
  ): boolean {
    // User can access if they're the owner and have the owner permission
    if (
      resourceOwnerId === userId &&
      this.hasPermission(userRoles, [ownerPermission])
    ) {
      return true;
    }

    // User can access if they have the admin permission
    return this.hasPermission(userRoles, [adminPermission]);
  }

  /**
   * Get all permission groups
   */
  getPermissionGroups(): Record<string, Permission[]> {
    return { ...this.permissionGroups };
  }

  /**
   * Get permissions for a specific group
   */
  getPermissionsForGroup(groupName: string): Permission[] {
    return this.permissionGroups[groupName] || [];
  }

  /**
   * Get all available permissions
   */
  getAllAvailablePermissions(): Permission[] {
    return Object.values(Permission);
  }
} 