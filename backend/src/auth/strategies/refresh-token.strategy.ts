import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express'; // For custom extractor

interface RefreshTokenPayload {
  username: string;
  sub: number; // User ID
  // Add any other fields you put in your refresh token payload
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') { // Unique name 'jwt-refresh'
  constructor(private configService: ConfigService) {
    const jwtRefreshSecret = configService.get<string>('JWT_REFRESH_SECRET');
    if (!jwtRefreshSecret) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Assumes refresh token is sent as Bearer
      secretOrKey: jwtRefreshSecret,
      passReqToCallback: false, // Set to true if you need request object in validate, e.g. to extract from body
    });
  }

  validate(payload: RefreshTokenPayload): any { // Return type can be more specific
    // This payload comes from the decoded refresh token.
    // It should contain user identifier (e.g., sub for userId).
    if (!payload.sub) {
        throw new UnauthorizedException('Invalid refresh token payload');
    }
    // We are returning the raw payload. AuthService.refreshToken will use this ID
    // and the actual refresh token (from request body/header) to validate against the stored hash.
    return { userId: payload.sub, username: payload.username };
  }
} 