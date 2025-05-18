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
var RolesGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const roles_decorator_1 = require("../decorators/roles.decorator");
const jwt_1 = require("@nestjs/jwt");
let RolesGuard = RolesGuard_1 = class RolesGuard {
    reflector;
    jwtService;
    logger = new common_1.Logger(RolesGuard_1.name);
    constructor(reflector, jwtService) {
        this.reflector = reflector;
        this.jwtService = jwtService;
    }
    async canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers?.authorization;
        if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
            this.logger.error('No authorization header present');
            throw new common_1.UnauthorizedException('Authorization header missing');
        }
        try {
            const token = authHeader.split(' ')[1];
            const payload = await this.jwtService.verifyAsync(token);
            request.user = {
                userId: payload.sub,
                email: payload.email,
                role: payload.role
            };
            this.logger.debug(`User role from token: ${payload.role}, Required roles: ${requiredRoles.join(', ')}`);
            if (!request.user || !request.user.role) {
                this.logger.error('User not authenticated in request');
                throw new common_1.UnauthorizedException('User not authenticated. Cannot perform role check.');
            }
            const hasRole = requiredRoles.some(role => request.user.role === role);
            if (!hasRole) {
                this.logger.warn(`User with role ${request.user.role} tried to access route requiring roles ${requiredRoles.join(', ')}`);
                throw new common_1.ForbiddenException('You do not have permission to access this resource');
            }
            return true;
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException || error instanceof common_1.ForbiddenException) {
                throw error;
            }
            this.logger.error(`JWT verification failed: ${error.message}`);
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = RolesGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        jwt_1.JwtService])
], RolesGuard);
//# sourceMappingURL=roles.guard.js.map