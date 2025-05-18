import { Injectable } from '@nestjs/common';
import { Role } from '../decorators/roles.decorator';
import { Permission } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsService {
  // Define which roles have which permissions
  private readonly rolePermissionsMap: Map<Role, Permission[]> = new Map([
    [
      Role.ADMIN,
      [
        // Admin-specific permissions
        Permission.MANAGE_USERS,
        Permission.CONFIGURE_SYSTEM, 
        Permission.VIEW_LOGS,
        
        // Admin can do everything organizers can
        Permission.MANAGE_EVENTS,
        Permission.MANAGE_ATTENDEES,
        Permission.MANAGE_STAFF,
        Permission.VIEW_ANALYTICS,
        
        // Admin can do everything staff can
        Permission.VIEW_EVENTS,
        Permission.MANAGE_TASKS,
        
        // Basic user permissions
        Permission.READ_PROFILE,
        Permission.UPDATE_PROFILE,
        
        // Legacy permissions
        Permission.READ_EVENT,
        Permission.CREATE_EVENT,
        Permission.UPDATE_EVENT,
        Permission.DELETE_EVENT,
        Permission.VIEW_ATTENDEES,
        Permission.CHECK_IN_ATTENDEE,
        Permission.CREATE_SUPPORT_TICKET,
        Permission.VIEW_SUPPORT_TICKETS,
        Permission.UPDATE_SUPPORT_TICKET,
        Permission.DELETE_SUPPORT_TICKET,
        Permission.SEND_NOTIFICATIONS,
        Permission.VIEW_REPORTS,
      ],
    ],
    [
      Role.ORGANIZER,
      [
        // Organizer-specific permissions
        Permission.MANAGE_EVENTS,
        Permission.MANAGE_ATTENDEES,
        Permission.MANAGE_STAFF,
        Permission.VIEW_ANALYTICS,
        
        // Basic permissions
        Permission.READ_PROFILE,
        Permission.UPDATE_PROFILE,
        
        // Legacy permissions
        Permission.READ_EVENT,
        Permission.CREATE_EVENT,
        Permission.UPDATE_EVENT,
        Permission.DELETE_EVENT,
        Permission.VIEW_ATTENDEES,
        Permission.CREATE_SUPPORT_TICKET,
        Permission.VIEW_SUPPORT_TICKETS,
        Permission.SEND_NOTIFICATIONS,
        Permission.VIEW_REPORTS,
      ],
    ],
    [
      Role.STAFF,
      [
        // Staff-specific permissions
        Permission.VIEW_EVENTS,
        Permission.MANAGE_TASKS,
        Permission.MANAGE_ATTENDEES,
        
        // Basic permissions
        Permission.READ_PROFILE,
        Permission.UPDATE_PROFILE,
        
        // Legacy permissions
        Permission.READ_EVENT, 
        Permission.VIEW_ATTENDEES,
        Permission.CHECK_IN_ATTENDEE,
        Permission.CREATE_SUPPORT_TICKET,
        Permission.VIEW_SUPPORT_TICKETS,
        Permission.UPDATE_SUPPORT_TICKET,
      ],
    ],
    [
      Role.USER,
      [
        // Regular users can only manage their own profiles
        Permission.READ_PROFILE,
        Permission.UPDATE_PROFILE,
        Permission.CREATE_SUPPORT_TICKET,
      ],
    ],
  ]);

  /**
   * Get permissions for a specific role
   */
  getPermissionsForRole(role: Role): Permission[] {
    return this.rolePermissionsMap.get(role) || [];
  }

  /**
   * Check if a role has a specific permission
   */
  hasPermission(userRoles: Role[], requiredPermissions: Permission[]): boolean {
    // Get all permissions the user has based on their roles
    const userPermissions = userRoles.flatMap(role => this.getPermissionsForRole(role));
    
    // Check if the user has all the required permissions
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Check if a role has all of the specified permissions
   */
  hasAllPermissions(role: Role, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission([role], [permission]));
  }

  /**
   * Check if a role has any of the specified permissions
   */
  hasAnyPermission(role: Role, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission([role], [permission]));
  }

  /**
   * Get all roles that have a specific permission
   */
  getRolesWithPermission(permission: Permission): Role[] {
    return Object.entries(this.rolePermissionsMap)
      .filter(([_, permissions]) => permissions.includes(permission))
      .map(([role, _]) => role as Role);
  }

  /**
   * Get missing permissions for a role compared to the required ones
   */
  getMissingPermissions(role: Role, requiredPermissions: Permission[]): Permission[] {
    const rolePermissions = this.getPermissionsForRole(role);
    return requiredPermissions.filter(permission => !rolePermissions.includes(permission));
  }
} 