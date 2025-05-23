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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const login_user_dto_1 = require("./dto/login-user.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const refresh_token_guard_1 = require("./guards/refresh-token.guard");
const resend_verification_email_dto_1 = require("./dto/resend-verification-email.dto");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async register(createUserDto) {
        return this.authService.register(createUserDto);
    }
    async login(loginUserDto) {
        const user = await this.authService.validateUser(loginUserDto.email, loginUserDto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }
    async refreshToken(req, authHeader) {
        const refreshTokenString = authHeader?.split(' ')[1];
        if (!refreshTokenString) {
            throw new common_1.UnauthorizedException('Refresh token not found in Authorization header');
        }
        return this.authService.refreshToken(req.user.sub, refreshTokenString);
    }
    async logout(req) {
        return this.authService.logout(req.user.sub);
    }
    getProfile(req) {
        return req.user;
    }
    async verifyEmail(token) {
        if (!token) {
            throw new common_1.BadRequestException('Verification token is missing.');
        }
        try {
            return await this.authService.verifyEmail(token);
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw new common_1.UnauthorizedException(error.message);
            }
            throw error;
        }
    }
    async resendVerificationEmailController(resendVerificationEmailDto) {
        return this.authService.resendVerificationEmail(resendVerificationEmailDto.email);
    }
    async forgotPasswordController(body) {
        if (!body || !body.email) {
            throw new common_1.BadRequestException('Email is required.');
        }
        return this.authService.forgotPassword(body.email);
    }
    async resetPasswordController(body) {
        if (!body || !body.token || !body.newPassword) {
            throw new common_1.BadRequestException('Token and new password are required.');
        }
        try {
            return await this.authService.resetPassword(body.token, body.newPassword);
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw new common_1.UnauthorizedException(error.message);
            }
            if (error instanceof common_1.BadRequestException) {
                throw new common_1.BadRequestException(error.message);
            }
            console.error('Unexpected error during password reset:', error);
            throw new common_1.InternalServerErrorException('Could not reset password.');
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_user_dto_1.LoginUserDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(refresh_token_guard_1.RefreshTokenGuard),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('verify-email'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('resend-verification'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [resend_verification_email_dto_1.ResendVerificationEmailDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendVerificationEmailController", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPasswordController", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPasswordController", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map