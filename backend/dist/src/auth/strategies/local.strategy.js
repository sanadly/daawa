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
var LocalStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_local_1 = require("passport-local");
const auth_service_1 = require("../auth.service");
let LocalStrategy = LocalStrategy_1 = class LocalStrategy extends (0, passport_1.PassportStrategy)(passport_local_1.Strategy) {
    authService;
    logger = new common_1.Logger(LocalStrategy_1.name);
    constructor(authService) {
        super({
            usernameField: 'email',
        });
        this.authService = authService;
        this.logger.debug('LocalStrategy initialized with usernameField: email');
    }
    async validate(email, pass) {
        this.logger.debug(`LocalStrategy validate called for email: ${email}, password provided: ${pass ? '******' + pass.slice(-3) : 'EMPTY'}`);
        try {
            const user = await this.authService.validateUser(email, pass);
            if (!user) {
                this.logger.warn(`Invalid credentials for email: ${email}`);
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            this.logger.debug(`User validated successfully: ${user.email}`);
            return user;
        }
        catch (error) {
            this.logger.error(`Authentication error in LocalStrategy: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException('Authentication failed in strategy');
        }
    }
};
exports.LocalStrategy = LocalStrategy;
exports.LocalStrategy = LocalStrategy = LocalStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], LocalStrategy);
//# sourceMappingURL=local.strategy.js.map