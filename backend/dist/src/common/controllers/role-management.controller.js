"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleManagementController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../guards/roles.guard");
const roles_decorator_1 = require("../decorators/roles.decorator");
const roles_decorator_2 = require("../decorators/roles.decorator");
const permissions_service_1 = require("../services/permissions.service");
const permissions_decorator_1 = require("../decorators/permissions.decorator");
const permissions_guard_1 = require("../guards/permissions.guard");
const prisma_service_1 = require("../../prisma/prisma.service");
class UpdateUserRoleDto {
    role;
}
let RoleManagementController = class RoleManagementController {
    permissionsService;
    prismaService;
    constructor(permissionsService, prismaService) {
        this.permissionsService = permissionsService;
        this.prismaService = prismaService;
    }
    getAllRoles() {
        return Object.values(roles_decorator_2.Role);
    }
    getAllPermissions() {
        return this.permissionsService.getAllAvailablePermissions();
    }
    getPermissionsForRole(role) {
        if (!Object.values(roles_decorator_2.Role).includes(role)) {
            throw new common_1.NotFoundException(`Role '${role}' not found`);
        }
        return this.permissionsService.getPermissionsForRole(role);
    }
    getPermissionGroups() {
        return this.permissionsService.getPermissionGroups();
    }
    async getUsersWithRoles() {
        const users = await this.prismaService.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });
        return users;
    }
    async updateUserRole(userId, updateUserRoleDto) {
        if (!Object.values(roles_decorator_2.Role).includes(updateUserRoleDto.role)) {
            throw new common_1.BadRequestException(`Invalid role: ${updateUserRoleDto.role}`);
        }
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${userId} not found`);
        }
        const updatedUser = await this.prismaService.user.update({
            where: { id: userId },
            data: { role: updateUserRoleDto.role },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });
        return updatedUser;
    }
    getMyPermissions(req) {
        if (!req.user || !req.user.roles) {
            throw new common_1.ForbiddenException('User not authenticated or missing roles');
        }
        const userRoles = req.user.roles;
        const permissions = this.permissionsService.getAllPermissionsForRoles(userRoles);
        return {
            roles: userRoles,
            permissions,
        };
    }
};
exports.RoleManagementController = RoleManagementController;
__decorate([
    (0, common_1.Get)('roles'),
    (0, roles_decorator_1.Roles)(roles_decorator_2.Role.ADMIN),
    (0, permissions_decorator_1.Permissions)(permissions_decorator_1.Permission.MANAGE_USERS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RoleManagementController.prototype, "getAllRoles", null);
__decorate([
    (0, common_1.Get)('permissions'),
    (0, roles_decorator_1.Roles)(roles_decorator_2.Role.ADMIN),
    (0, permissions_decorator_1.Permissions)(permissions_decorator_1.Permission.MANAGE_USERS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RoleManagementController.prototype, "getAllPermissions", null);
__decorate([
    (0, common_1.Get)('roles/:role/permissions'),
    (0, roles_decorator_1.Roles)(roles_decorator_2.Role.ADMIN),
    (0, permissions_decorator_1.Permissions)(permissions_decorator_1.Permission.MANAGE_USERS),
    __param(0, (0, common_1.Param)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RoleManagementController.prototype, "getPermissionsForRole", null);
__decorate([
    (0, common_1.Get)('permission-groups'),
    (0, roles_decorator_1.Roles)(roles_decorator_2.Role.ADMIN),
    (0, permissions_decorator_1.Permissions)(permissions_decorator_1.Permission.MANAGE_USERS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RoleManagementController.prototype, "getPermissionGroups", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, roles_decorator_1.Roles)(roles_decorator_2.Role.ADMIN),
    (0, permissions_decorator_1.Permissions)(permissions_decorator_1.Permission.MANAGE_USERS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RoleManagementController.prototype, "getUsersWithRoles", null);
__decorate([
    (0, common_1.Put)('users/:userId/role'),
    (0, roles_decorator_1.Roles)(roles_decorator_2.Role.ADMIN),
    (0, permissions_decorator_1.Permissions)(permissions_decorator_1.Permission.MANAGE_USERS),
    __param(0, (0, common_1.Param)('userId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, UpdateUserRoleDto]),
    __metadata("design:returntype", Promise)
], RoleManagementController.prototype, "updateUserRole", null);
__decorate([
    (0, common_1.Get)('my-permissions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RoleManagementController.prototype, "getMyPermissions", null);
exports.RoleManagementController = RoleManagementController = __decorate([
    (0, common_1.Controller)('role-management'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [permissions_service_1.PermissionsService,
        prisma_service_1.PrismaService])
], RoleManagementController);
//# sourceMappingURL=role-management.controller.js.map