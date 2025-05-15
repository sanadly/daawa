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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
const email_service_1 = require("../email/email.service");
let AuthService = AuthService_1 = class AuthService {
    usersService;
    jwtService;
    configService;
    emailService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(usersService, jwtService, configService, emailService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.emailService = emailService;
    }
    async validateUser(username, pass) {
        const user = await this.usersService.findOneByUsername(username);
        if (user && (await bcrypt.compare(pass, user.password))) {
            if (!user.isEmailVerified) {
                throw new common_1.UnauthorizedException('Please verify your email address before logging in.');
            }
            return { id: user.id, username: user.username, email: user.email };
        }
        return null;
    }
    async getTokens(userId, username) {
        const jwtSecret = this.configService.get('JWT_SECRET');
        const jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN') || '3600s';
        const jwtRefreshSecret = this.configService.get('JWT_REFRESH_SECRET');
        const jwtRefreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d';
        if (!jwtSecret || !jwtRefreshSecret) {
            throw new Error('JWT signing secrets are not configured properly.');
        }
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync({ sub: userId, username }, {
                secret: jwtSecret,
                expiresIn: jwtExpiresIn,
            }),
            this.jwtService.signAsync({ sub: userId, username }, {
                secret: jwtRefreshSecret,
                expiresIn: jwtRefreshExpiresIn,
            }),
        ]);
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }
    async login(user) {
        const tokens = await this.getTokens(user.id, user.username);
        await this.usersService.setCurrentRefreshToken(tokens.refresh_token, user.id);
        return {
            ...tokens,
            user,
        };
    }
    async register(createUserDto) {
        const existingUserByUsername = await this.usersService.findOneByUsername(createUserDto.username);
        if (existingUserByUsername) {
            throw new common_1.ConflictException('Username already exists');
        }
        const existingUserByEmail = await this.usersService.findOneByEmail(createUserDto.email);
        if (existingUserByEmail) {
            throw new common_1.ConflictException('Email already registered');
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const userEntity = await this.usersService.create({
            ...createUserDto,
            password: hashedPassword,
            emailVerificationToken,
            isEmailVerified: false,
        });
        if (!userEntity) {
            this.logger.error('User creation did not return an entity.');
            throw new Error('User registration failed.');
        }
        try {
            await this.emailService.sendVerificationEmail(userEntity.email, userEntity.username, emailVerificationToken);
            this.logger.log(`Verification email process initiated for ${userEntity.username}`);
        }
        catch (error) {
            this.logger.error(`Failed to send verification email to ${userEntity.email}`, error instanceof Error ? error.stack : 'Unknown error stack');
        }
        return {
            id: userEntity.id,
            username: userEntity.username,
            email: userEntity.email,
        };
    }
    async refreshToken(userId, rt) {
        const user = await this.usersService.getUserIfRefreshTokenMatches(rt, userId);
        if (!user) {
            throw new common_1.UnauthorizedException('Access Denied: Invalid refresh token or user mismatch');
        }
        const tokens = await this.getTokens(user.id, user.username);
        await this.usersService.setCurrentRefreshToken(tokens.refresh_token, user.id);
        return tokens;
    }
    async logout(userId) {
        await this.usersService.setCurrentRefreshToken(null, userId);
        return { message: 'Logout successful' };
    }
    async verifyEmail(token) {
        const user = await this.usersService.findOneByEmailVerificationToken(token);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid or expired verification token.');
        }
        if (user.isEmailVerified) {
            return {
                message: 'Email already verified.',
                user: { id: user.id, username: user.username, email: user.email },
            };
        }
        await this.usersService.setEmailVerified(user.id);
        return {
            message: 'Email successfully verified.',
            user: { id: user.id, username: user.username, email: user.email },
        };
    }
    async resendVerificationEmail(email) {
        this.logger.log(`Resend verification email requested for: ${email}`);
        const user = await this.usersService.findOneByEmail(email);
        if (!user) {
            throw new common_1.NotFoundException('User with this email not found.');
        }
        if (user.isEmailVerified) {
            return { message: 'This email address is already verified.' };
        }
        const newEmailVerificationToken = crypto.randomBytes(32).toString('hex');
        try {
            await this.usersService.updateEmailVerificationToken(user.id, newEmailVerificationToken);
            await this.emailService.sendVerificationEmail(user.email, user.username, newEmailVerificationToken);
            return { message: 'Verification email sent. Please check your inbox.' };
        }
        catch (error) {
            this.logger.error(`Failed to resend verification email to ${user.email}`, error instanceof Error ? error.stack : 'Unknown error during resend');
            throw new common_1.InternalServerErrorException('Failed to resend verification email. Please try again later.');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map