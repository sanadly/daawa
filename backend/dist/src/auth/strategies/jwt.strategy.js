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
var JwtStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const prisma_service_1 = require("../../prisma/prisma.service");
const config_1 = require("@nestjs/config");
let JwtStrategy = JwtStrategy_1 = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt') {
    prisma;
    configService;
    logger = new common_1.Logger(JwtStrategy_1.name);
    constructor(prisma, configService) {
        const jwtSecret = configService.get('JWT_SECRET');
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtSecret || 'Aachen##2024-DefaultSecret',
        });
        this.prisma = prisma;
        this.configService = configService;
        if (!jwtSecret) {
            this.logger.warn('JWT_SECRET not found in environment, using default secret. This is NOT secure for production!');
        }
        this.logger.debug(`Initializing JWT strategy with secret of length: ${(jwtSecret || 'Aachen##2024-DefaultSecret').length}`);
    }
    async validate(payload) {
        this.logger.debug(`Validating JWT payload for user ID: ${payload.sub}`);
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user) {
                this.logger.warn(`User with ID ${payload.sub} not found during JWT validation`);
                throw new common_1.UnauthorizedException('User not found');
            }
            if (!user.isEmailVerified) {
                this.logger.warn(`User ${user.email} has not verified their email.`);
            }
            this.logger.debug(`JWT validation successful for user: ${user.email}`);
            const { password, ...userWithoutPassword } = user;
            return {
                ...userWithoutPassword,
                roles: [user.role],
            };
        }
        catch (error) {
            this.logger.error(`JWT validation error: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
            throw new common_1.UnauthorizedException('Invalid token or user not found');
        }
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = JwtStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map