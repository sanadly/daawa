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
    async validateUser(emailInput, pass) {
        this.logger.debug(`Validating user: ${emailInput}`);
        const user = await this.usersService.findOneByEmail(emailInput);
        if (!user) {
            this.logger.warn(`ValidateUser: User not found - ${emailInput}`);
            return null;
        }
        if (!user.password) {
            this.logger.warn(`ValidateUser: User ${emailInput} has no password set.`);
            return null;
        }
        const isPasswordMatch = await bcrypt.compare(pass, user.password);
        this.logger.debug(`ValidateUser for ${emailInput}: Password match result - ${isPasswordMatch}`);
        if (user && user.password && isPasswordMatch) {
            if (!user.isEmailVerified) {
                this.logger.warn(`ValidateUser: Email not verified for ${emailInput}`);
                throw new common_1.UnauthorizedException('Please verify your email address before logging in.');
            }
            return { id: user.id, email: user.email, role: user.role };
        }
        return null;
    }
    async getTokens(userId, email, userRole) {
        const jwtPayload = {
            sub: userId,
            email: email,
            role: userRole,
        };
        const jwtSecret = this.configService.get('JWT_SECRET');
        const jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN') || '3600s';
        const jwtRefreshSecret = this.configService.get('JWT_REFRESH_SECRET');
        const jwtRefreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d';
        if (!jwtSecret || !jwtRefreshSecret) {
            this.logger.error('JWT signing secrets are not configured properly.');
            throw new common_1.InternalServerErrorException('Error generating tokens.');
        }
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(jwtPayload, {
                secret: jwtSecret,
                expiresIn: jwtExpiresIn,
            }),
            this.jwtService.signAsync({ sub: userId }, {
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
        const tokens = await this.getTokens(user.id, user.email, user.role);
        await this.usersService.setCurrentRefreshToken(tokens.refresh_token, user.id);
        return {
            ...tokens,
            user,
        };
    }
    async register(authRegisterDto) {
        const { email, password, name } = authRegisterDto;
        const existingUserByEmail = await this.usersService.findOneByEmail(email);
        if (existingUserByEmail) {
            throw new common_1.ConflictException('Email already registered');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        const createUserData = {
            email,
            password: hashedPassword,
            name: name || null,
            emailVerificationToken,
            isEmailVerified: false,
        };
        const userEntity = await this.usersService.create(createUserData);
        if (!userEntity) {
            this.logger.error('User creation failed to return an entity.');
            throw new common_1.InternalServerErrorException('User registration failed.');
        }
        try {
            await this.emailService.sendVerificationEmail(userEntity.email, userEntity.name || userEntity.email, emailVerificationToken);
            this.logger.log(`Verification email process initiated for ${userEntity.email}`);
        }
        catch (error) {
            this.logger.error(`Failed to send verification email to ${userEntity.email}`, error instanceof Error ? error.stack : String(error));
        }
        return {
            id: userEntity.id,
            email: userEntity.email,
            role: userEntity.role,
        };
    }
    async refreshToken(userId, rt) {
        const user = await this.usersService.getUserIfRefreshTokenMatches(rt, userId);
        if (!user) {
            throw new common_1.UnauthorizedException('Access Denied: Invalid refresh token or user mismatch');
        }
        const tokens = await this.getTokens(user.id, user.email, user.role);
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
                user: { id: user.id, email: user.email, role: user.role },
            };
        }
        const updatedUser = await this.usersService.setEmailVerified(user.id);
        return {
            message: 'Email successfully verified.',
            user: { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
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
            const updatedUser = await this.usersService.updateEmailVerificationToken(user.id, newEmailVerificationToken);
            await this.emailService.sendVerificationEmail(updatedUser.email, updatedUser.name || updatedUser.email, newEmailVerificationToken);
            return { message: 'Verification email sent. Please check your inbox.' };
        }
        catch (error) {
            this.logger.error(`Failed to resend verification email to ${user.email}`, error instanceof Error ? error.stack : String(error));
            throw new common_1.InternalServerErrorException('Failed to resend verification email. Please try again later.');
        }
    }
    async forgotPassword(email) {
        this.logger.log(`Forgot password requested for: ${email}`);
        const user = await this.usersService.findOneByEmail(email);
        if (user) {
            try {
                const token = crypto.randomBytes(32).toString('hex');
                const expires = new Date(Date.now() + 3600000);
                await this.usersService.createPasswordResetToken(user.id, token, expires);
                this.logger.log(`VERY DISTINCT LOG: About to call sendPasswordResetEmail for ${user.email} with token ${token}`);
                await this.emailService.sendPasswordResetEmail(user.email, user.name || user.email, token);
            }
            catch (error) {
                this.logger.error(`Failed to process forgot password for ${email}`, error instanceof Error ? error.stack : String(error));
            }
        }
        else {
            this.logger.log(`Forgot password request for non-existent email: ${email}`);
        }
        return {
            message: 'If an account with that email exists, a password reset link has been sent.',
        };
    }
    async resetPassword(token, newPassword) {
        this.logger.log(`Reset password attempt with token: ${token?.substring(0, 10)}...`);
        if (!newPassword) {
            throw new common_1.BadRequestException('New password is required.');
        }
        if (newPassword.length < 8) {
            throw new common_1.BadRequestException('Password must be at least 8 characters long.');
        }
        const user = await this.usersService.findUserByPasswordResetToken(token);
        if (!user) {
            this.logger.warn(`Invalid or expired password reset token used: ${token?.substring(0, 10)}...`);
            throw new common_1.UnauthorizedException('Invalid or expired password reset token.');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usersService.updatePassword(user.id, hashedPassword);
        await this.usersService.clearPasswordResetTokensForUser(user.id);
        this.logger.log(`Password reset successfully for user ID: ${user.id}`);
        return { message: 'Password has been reset successfully.' };
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