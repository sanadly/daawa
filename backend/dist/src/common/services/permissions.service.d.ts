import { Role } from '../decorators/roles.decorator';
import { Permission } from '../decorators/permissions.decorator';
export interface PermissionGroup {
    name: string;
    permissions: Permission[];
}
export declare class PermissionsService {
    private readonly permissionGroups;
    private readonly rolePermissionsMap;
    getPermissionsForRole(role: Role): Permission[];
    getAllPermissionsForRoles(roles: Role[]): Permission[];
    hasPermission(userRoles: Role[], requiredPermissions: Permission[]): boolean;
    hasAnyPermission(userRoles: Role[], permissions: Permission[]): boolean;
    hasPermissionGroup(userRoles: Role[], groupName: string): boolean;
    canAccessOwnedResource(userRoles: Role[], resourceOwnerId: number | string, userId: number | string, ownerPermission: Permission, adminPermission: Permission): boolean;
    getPermissionGroups(): Record<string, Permission[]>;
    getPermissionsForGroup(groupName: string): Permission[];
    getAllAvailablePermissions(): Permission[];
}
