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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOneByEmail(email) {
        return this.prisma.user.findUnique({ where: { email } });
    }
    async findOneById(id) {
        return this.prisma.user.findUnique({ where: { id } });
    }
    async create(data) {
        return this.prisma.user.create({
            data: {
                ...data,
            },
        });
    }
    async setCurrentRefreshToken(refreshToken, userId) {
        let hashedRefreshToken = null;
        if (refreshToken) {
            hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { hashedRefreshToken },
        });
    }
    async getUserIfRefreshTokenMatches(refreshToken, userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.hashedRefreshToken) {
            return null;
        }
        const isRefreshTokenMatching = await bcrypt.compare(refreshToken, user.hashedRefreshToken);
        return isRefreshTokenMatching ? user : null;
    }
    async findOneByEmailVerificationToken(token) {
        return this.prisma.user.findUnique({
            where: { emailVerificationToken: token },
        });
    }
    async setEmailVerified(userId) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                isEmailVerified: true,
                emailVerificationToken: null,
            },
        });
    }
    async updateEmailVerificationToken(userId, newToken) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { emailVerificationToken: newToken, isEmailVerified: false },
        });
    }
    async updatePassword(userId, newPasswordHash) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { password: newPasswordHash },
        });
    }
    async createPasswordResetToken(userId, token, expires) {
        await this.prisma.passwordResetToken.deleteMany({ where: { userId } });
        return this.prisma.passwordResetToken.create({
            data: { userId, token, expires },
        });
    }
    async findUserByPasswordResetToken(tokenValue) {
        const resetTokenRecord = await this.prisma.passwordResetToken.findUnique({
            where: { token: tokenValue },
            include: { user: true },
        });
        if (!resetTokenRecord || !resetTokenRecord.user)
            return null;
        if (new Date() > resetTokenRecord.expires) {
            await this.prisma.passwordResetToken.delete({ where: { id: resetTokenRecord.id } });
            return null;
        }
        return resetTokenRecord.user;
    }
    async clearPasswordResetTokensForUser(userId) {
        await this.prisma.passwordResetToken.deleteMany({ where: { userId } });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map