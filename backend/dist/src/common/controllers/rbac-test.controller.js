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
exports.RbacTestController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_decorator_1 = require("../decorators/roles.decorator");
const roles_decorator_2 = require("../decorators/roles.decorator");
const roles_guard_1 = require("../guards/roles.guard");
const permissions_guard_1 = require("../guards/permissions.guard");
const permissions_decorator_1 = require("../decorators/permissions.decorator");
let RbacTestController = class RbacTestController {
    public() {
        return 'This endpoint is public and does not require authentication';
    }
    authenticated(req) {
        return {
            message: 'This endpoint requires authentication',
            user: req.user,
        };
    }
    staffAccess(req) {
        return {
            message: 'This endpoint requires STAFF, ORGANIZER, or ADMIN role',
            user: req.user,
        };
    }
    organizerAccess(req) {
        return {
            message: 'This endpoint requires ORGANIZER or ADMIN role',
            user: req.user,
        };
    }
    adminAccess(req) {
        return {
            message: 'This endpoint requires ADMIN role',
            user: req.user,
        };
    }
    viewEventsAccess(req) {
        return {
            message: 'This endpoint requires VIEW_EVENTS permission',
            user: req.user,
        };
    }
    manageEventsAccess(req) {
        return {
            message: 'This endpoint requires MANAGE_EVENTS permission',
            user: req.user,
        };
    }
    adminOperationsAccess(req) {
        return {
            message: 'This endpoint requires CONFIGURE_SYSTEM and MANAGE_USERS permissions',
            user: req.user,
        };
    }
    combinedAuthAccess(req) {
        return {
            message: 'This endpoint requires both role and permission checks',
            user: req.user,
        };
    }
};
exports.RbacTestController = RbacTestController;
__decorate([
    (0, common_1.Get)('public'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], RbacTestController.prototype, "public", null);
__decorate([
    (0, common_1.Get)('authenticated'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], RbacTestController.prototype, "authenticated", null);
__decorate([
    (0, common_1.Get)('staff'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_decorator_2.Role.STAFF, roles_decorator_2.Role.ORGANIZER, roles_decorator_2.Role.ADMIN),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], RbacTestController.prototype, "staffAccess", null);
__decorate([
    (0, common_1.Get)('organizer'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_decorator_2.Role.ORGANIZER, roles_decorator_2.Role.ADMIN),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], RbacTestController.prototype, "organizerAccess", null);
__decorate([
    (0, common_1.Get)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_decorator_2.Role.ADMIN),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], RbacTestController.prototype, "adminAccess", null);
__decorate([
    (0, common_1.Get)('view-events'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(permissions_decorator_1.Permission.VIEW_EVENTS),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], RbacTestController.prototype, "viewEventsAccess", null);
__decorate([
    (0, common_1.Get)('manage-events'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(permissions_decorator_1.Permission.MANAGE_EVENTS),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], RbacTestController.prototype, "manageEventsAccess", null);
__decorate([
    (0, common_1.Get)('admin-operations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(permissions_decorator_1.Permission.CONFIGURE_SYSTEM, permissions_decorator_1.Permission.MANAGE_USERS),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], RbacTestController.prototype, "adminOperationsAccess", null);
__decorate([
    (0, common_1.Get)('combined-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, roles_decorator_1.Roles)(roles_decorator_2.Role.ORGANIZER, roles_decorator_2.Role.ADMIN),
    (0, permissions_decorator_1.Permissions)(permissions_decorator_1.Permission.MANAGE_EVENTS),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], RbacTestController.prototype, "combinedAuthAccess", null);
exports.RbacTestController = RbacTestController = __decorate([
    (0, common_1.Controller)('rbac-test')
], RbacTestController);
//# sourceMappingURL=rbac-test.controller.js.map