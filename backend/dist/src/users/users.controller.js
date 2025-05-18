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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const users_service_1 = require("./users.service");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const bcrypt = require("bcrypt");
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getProfile(req) {
        const user = await this.usersService.findOneById(req.user.sub);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        const { password, hashedRefreshToken, emailVerificationToken, ...profileData } = user;
        return profileData;
    }
    async updateProfile(req, updateProfileDto) {
        const userId = req.user.sub;
        const user = await this.usersService.findOneById(userId);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (updateProfileDto.email && updateProfileDto.email !== user.email) {
            const existingUser = await this.usersService.findOneByEmail(updateProfileDto.email);
            if (existingUser) {
                throw new common_1.ConflictException('Email is already taken');
            }
        }
        if (updateProfileDto.newPassword) {
            if (!updateProfileDto.currentPassword) {
                throw new common_1.BadRequestException('Current password is required to set a new password');
            }
            const isPasswordValid = await bcrypt.compare(updateProfileDto.currentPassword, user.password);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException('Current password is incorrect');
            }
            const hashedPassword = await bcrypt.hash(updateProfileDto.newPassword, 10);
            const updatedUser = await this.usersService.updateProfile(userId, {
                ...updateProfileDto,
                password: hashedPassword,
            });
            const { password, hashedRefreshToken, emailVerificationToken, ...profileData } = updatedUser;
            return profileData;
        }
        const { newPassword, currentPassword, ...profileData } = updateProfileDto;
        const updatedUser = await this.usersService.updateProfile(userId, profileData);
        const { password, hashedRefreshToken, emailVerificationToken, ...updatedProfileData } = updatedUser;
        return updatedProfileData;
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Put)('profile'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map