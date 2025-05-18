"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacModule = void 0;
const common_1 = require("@nestjs/common");
const permissions_service_1 = require("../services/permissions.service");
const role_management_controller_1 = require("../controllers/role-management.controller");
const prisma_service_1 = require("../../prisma/prisma.service");
const jwt_auth_guard_1 = require("../../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../guards/roles.guard");
const permissions_guard_1 = require("../guards/permissions.guard");
const core_1 = require("@nestjs/core");
let RbacModule = class RbacModule {
};
exports.RbacModule = RbacModule;
exports.RbacModule = RbacModule = __decorate([
    (0, common_1.Module)({
        controllers: [role_management_controller_1.RoleManagementController],
        providers: [
            permissions_service_1.PermissionsService,
            prisma_service_1.PrismaService,
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: permissions_guard_1.PermissionsGuard,
            },
        ],
        exports: [permissions_service_1.PermissionsService],
    })
], RbacModule);
//# sourceMappingURL=rbac.module.js.map