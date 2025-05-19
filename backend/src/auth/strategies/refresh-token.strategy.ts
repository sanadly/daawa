import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express'; // For custom extractor
import { JwtPayload } from '../types/jwt-payload.interface'; // Ensure this path is correct
import { AuthService } from '../auth.service'; // To validate user if needed

// const DEFAULT_JWT_REFRESH_SECRET = 'YourDefaultRefreshSecret'; // Example: Remove if unused
// interface RefreshTokenPayload { sub: number; username: string; } // Example: Remove if unused

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  private readonly logger = new Logger(RefreshTokenStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService, // Optional: if you need to re-validate user on refresh
  ) {
    const refreshTokenSecret = configService.get<string>(
      'JWT_REFRESH_SECRET',
    );

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: refreshTokenSecret || 'Aachen##2024-DefaultRefreshSecret', // Fallback
      passReqToCallback: true, // Pass request to validate method
    });

    if (!refreshTokenSecret) {
      this.logger.warn(
        'JWT_REFRESH_SECRET not found in environment, using default. This is NOT secure for production!',
      );
    }
    
    this.logger.debug(
      `Initializing RefreshTokenStrategy with secret of length: ${(refreshTokenSecret || 'Aachen##2024-DefaultRefreshSecret').length}`,
    );
  }

  async validate(req: Request, payload: JwtPayload): Promise<any> {
    const refreshToken = req.get('authorization')?.split(' ')[1];
    this.logger.debug(
      `Validating refresh token for user ID: ${payload.sub}`
    );

    if (!refreshToken) {
      this.logger.error('Refresh token not found in request');
      throw new UnauthorizedException('Refresh token missing');
    }

    try {
      // You could add further validation here, e.g., check if the user still exists
      // or if the refresh token is in a denylist (if you implement revocation)
      // const user = await this.authService.validateUserById(payload.sub);
      // if (!user) {
      //   throw new UnauthorizedException('User not found');
      // }
      this.logger.debug('Refresh token validation successful');
      return { ...payload, refreshToken }; // Append refreshToken to payload for service use
    } catch (error) {
      this.logger.error(
        `Refresh token validation error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined
      );
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
} 