import { Role } from '../decorators/roles.decorator';
import { PermissionsService } from '../services/permissions.service';
import { Permission } from '../decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';
interface RequestWithUser extends Request {
    user: {
        roles: Role[];
        [key: string]: any;
    };
}
declare class UpdateUserRoleDto {
    role: Role;
}
export declare class RoleManagementController {
    private readonly permissionsService;
    private readonly prismaService;
    constructor(permissionsService: PermissionsService, prismaService: PrismaService);
    getAllRoles(): Role[];
    getAllPermissions(): Permission[];
    getPermissionsForRole(role: string): Permission[];
    getPermissionGroups(): Record<string, Permission[]>;
    getUsersWithRoles(): Promise<{
        id: number;
        email: string;
        name: string | null;
        role: import("@prisma/client").$Enums.Role;
    }[]>;
    updateUserRole(userId: number, updateUserRoleDto: UpdateUserRoleDto): Promise<{
        id: number;
        email: string;
        name: string | null;
        role: import("@prisma/client").$Enums.Role;
    }>;
    getMyPermissions(req: RequestWithUser): {
        roles: Role[];
        permissions: Permission[];
    };
}
export {};
