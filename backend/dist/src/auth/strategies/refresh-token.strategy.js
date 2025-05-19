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
var RefreshTokenStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("../auth.service");
let RefreshTokenStrategy = RefreshTokenStrategy_1 = class RefreshTokenStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt-refresh') {
    configService;
    authService;
    logger = new common_1.Logger(RefreshTokenStrategy_1.name);
    constructor(configService, authService) {
        const refreshTokenSecret = configService.get('JWT_REFRESH_SECRET');
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: refreshTokenSecret || 'Aachen##2024-DefaultRefreshSecret',
            passReqToCallback: true,
        });
        this.configService = configService;
        this.authService = authService;
        if (!refreshTokenSecret) {
            this.logger.warn('JWT_REFRESH_SECRET not found in environment, using default. This is NOT secure for production!');
        }
        this.logger.debug(`Initializing RefreshTokenStrategy with secret of length: ${(refreshTokenSecret || 'Aachen##2024-DefaultRefreshSecret').length}`);
    }
    async validate(req, payload) {
        const refreshToken = req.get('authorization')?.split(' ')[1];
        this.logger.debug(`Validating refresh token for user ID: ${payload.sub}`);
        if (!refreshToken) {
            this.logger.error('Refresh token not found in request');
            throw new common_1.UnauthorizedException('Refresh token missing');
        }
        try {
            this.logger.debug('Refresh token validation successful');
            return { ...payload, refreshToken };
        }
        catch (error) {
            this.logger.error(`Refresh token validation error: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
};
exports.RefreshTokenStrategy = RefreshTokenStrategy;
exports.RefreshTokenStrategy = RefreshTokenStrategy = RefreshTokenStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        auth_service_1.AuthService])
], RefreshTokenStrategy);
//# sourceMappingURL=refresh-token.strategy.js.map