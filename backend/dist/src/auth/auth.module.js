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
var AuthModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const users_module_1 = require("../users/users.module");
const passport_1 = require("@nestjs/passport");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const refresh_token_strategy_1 = require("./strategies/refresh-token.strategy");
const local_strategy_1 = require("./strategies/local.strategy");
const DEFAULT_JWT_SECRET = 'Aachen##2024-DefaultSecret';
const DEFAULT_JWT_REFRESH_SECRET = 'Aachen##2024-DefaultRefreshSecret';
const DEFAULT_JWT_EXPIRES_IN = '1d';
const DEFAULT_JWT_REFRESH_EXPIRES_IN = '7d';
let AuthModule = AuthModule_1 = class AuthModule {
    configService;
    logger = new common_1.Logger(AuthModule_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        this.logger.debug('AuthModule initialized');
        const jwtSecret = this.configService.get('JWT_SECRET') || DEFAULT_JWT_SECRET;
        this.logger.debug(`JWT_SECRET: ${jwtSecret ? 'Configured (length: ' + jwtSecret.length + ')' : 'MISSING!'}`);
        const jwtRefreshSecret = this.configService.get('JWT_REFRESH_SECRET') || DEFAULT_JWT_REFRESH_SECRET;
        this.logger.debug(`JWT_REFRESH_SECRET: ${jwtRefreshSecret ? 'Configured (length: ' + jwtRefreshSecret.length + ')' : 'MISSING!'}`);
        const jwtExpiresIn = this.configService.get('JWT_EXPIRES_IN') || DEFAULT_JWT_EXPIRES_IN;
        this.logger.debug(`JWT_EXPIRES_IN: ${jwtExpiresIn}`);
        const jwtRefreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN') || DEFAULT_JWT_REFRESH_EXPIRES_IN;
        this.logger.debug(`JWT_REFRESH_EXPIRES_IN: ${jwtRefreshExpiresIn}`);
    }
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = AuthModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [
            users_module_1.UsersModule,
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            config_1.ConfigModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    const logger = new common_1.Logger('JwtModule');
                    const secret = configService.get('JWT_SECRET') || DEFAULT_JWT_SECRET;
                    if (!configService.get('JWT_SECRET')) {
                        logger.warn('JWT_SECRET not found in environment, using default secret. This is NOT secure for production!');
                    }
                    const expiresIn = configService.get('JWT_EXPIRES_IN') || DEFAULT_JWT_EXPIRES_IN;
                    logger.debug(`JWT configured with secret (length: ${secret.length}) and expiresIn: ${expiresIn}`);
                    return {
                        secret,
                        signOptions: {
                            expiresIn,
                        },
                    };
                },
                inject: [config_1.ConfigService],
            }),
        ],
        providers: [
            auth_service_1.AuthService,
            jwt_strategy_1.JwtStrategy,
            refresh_token_strategy_1.RefreshTokenStrategy,
            local_strategy_1.LocalStrategy,
            {
                provide: 'APP_DEBUG_AUTH',
                useFactory: () => {
                    const logger = new common_1.Logger('AuthModule');
                    logger.debug('AuthModule providers initialized');
                    logger.debug('Registered strategies: JWT, RefreshToken, Local');
                    return true;
                }
            }
        ],
        controllers: [auth_controller_1.AuthController],
        exports: [auth_service_1.AuthService],
    }),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AuthModule);
//# sourceMappingURL=auth.module.js.map