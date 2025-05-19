import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module'; // We will create this next
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { LocalStrategy } from './strategies/local.strategy';

// Default values if environment variables are not set
const DEFAULT_JWT_SECRET = 'Aachen##2024-DefaultSecret';
const DEFAULT_JWT_REFRESH_SECRET = 'Aachen##2024-DefaultRefreshSecret';
const DEFAULT_JWT_EXPIRES_IN = '1d';
const DEFAULT_JWT_REFRESH_EXPIRES_IN = '7d';

@Module({
  imports: [
    UsersModule, // To use UsersService for finding users
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule, // To use ConfigService for JWT secret and expiration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('JwtModule');
        
        // Get secret from environment or use default
        const secret = configService.get<string>('JWT_SECRET') || DEFAULT_JWT_SECRET;
        if (!configService.get<string>('JWT_SECRET')) {
          logger.warn('JWT_SECRET not found in environment, using default secret. This is NOT secure for production!');
        }
        
        // Get expires in from environment or use default
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || DEFAULT_JWT_EXPIRES_IN;
        
        logger.debug(`JWT configured with secret (length: ${secret.length}) and expiresIn: ${expiresIn}`);
        
        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService, 
    JwtStrategy, 
    RefreshTokenStrategy, 
    LocalStrategy,
    {
      provide: 'APP_DEBUG_AUTH',
      useFactory: () => {
        const logger = new Logger('AuthModule');
        logger.debug('AuthModule providers initialized');
        logger.debug('Registered strategies: JWT, RefreshToken, Local');
        return true;
      }
    }
  ],
  controllers: [AuthController],
  exports: [AuthService], // Export AuthService if other modules need it
})
export class AuthModule implements OnModuleInit {
  private readonly logger = new Logger(AuthModule.name);
  
  constructor(private configService: ConfigService) {}
  
  onModuleInit() {
    this.logger.debug('AuthModule initialized');
    
    // Check JWT configuration
    const jwtSecret = this.configService.get<string>('JWT_SECRET') || DEFAULT_JWT_SECRET;
    this.logger.debug(`JWT_SECRET: ${jwtSecret ? 'Configured (length: ' + jwtSecret.length + ')' : 'MISSING!'}`);
    
    const jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || DEFAULT_JWT_REFRESH_SECRET;
    this.logger.debug(`JWT_REFRESH_SECRET: ${jwtRefreshSecret ? 'Configured (length: ' + jwtRefreshSecret.length + ')' : 'MISSING!'}`);
    
    const jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || DEFAULT_JWT_EXPIRES_IN;
    this.logger.debug(`JWT_EXPIRES_IN: ${jwtExpiresIn}`);
    
    const jwtRefreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || DEFAULT_JWT_REFRESH_EXPIRES_IN;
    this.logger.debug(`JWT_REFRESH_EXPIRES_IN: ${jwtRefreshExpiresIn}`);
  }
} 