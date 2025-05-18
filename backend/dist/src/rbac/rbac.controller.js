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
exports.RbacController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let RbacController = class RbacController {
    getAdminResource(req) {
        if (req.user.role !== 'ADMIN') {
            throw new common_1.ForbiddenException('You do not have permission to access this resource');
        }
        return { message: 'Admin resource accessed successfully' };
    }
    getOrganizerResource(req) {
        if (req.user.role !== 'ORGANIZER') {
            throw new common_1.ForbiddenException('You do not have permission to access this resource');
        }
        return { message: 'Organizer resource accessed successfully' };
    }
    getStaffResource(req) {
        if (req.user.role !== 'STAFF') {
            throw new common_1.ForbiddenException('You do not have permission to access this resource');
        }
        return { message: 'Staff resource accessed successfully' };
    }
    getAuthenticatedResource() {
        return { message: 'Authenticated user resource accessed successfully' };
    }
};
exports.RbacController = RbacController;
__decorate([
    (0, common_1.Get)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RbacController.prototype, "getAdminResource", null);
__decorate([
    (0, common_1.Get)('organizer'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RbacController.prototype, "getOrganizerResource", null);
__decorate([
    (0, common_1.Get)('staff'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RbacController.prototype, "getStaffResource", null);
__decorate([
    (0, common_1.Get)('authenticated'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RbacController.prototype, "getAuthenticatedResource", null);
exports.RbacController = RbacController = __decorate([
    (0, common_1.Controller)('rbac')
], RbacController);
//# sourceMappingURL=rbac.controller.js.map