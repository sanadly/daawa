import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service'; // To potentially fetch full user object
import { Role } from '../../common/enums/role.enum';

// This matches the payload structure used in AuthService.login
interface JwtPayload {
  sub: number; // User ID
  email: string; // User email
  role: Role; // User role
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService, // Inject UsersService
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  // Passport first verifies the JWT's signature and expiration using the secretOrKey.
  // If valid, this validate method is called with the decoded JSON as its single argument.
  async validate(payload: JwtPayload): Promise<any> {
    // Fetch the full user object from the database to get the current role
    const user = await this.usersService.findOneById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return user info including role for RBAC
    return {
      userId: payload.sub,
      email: payload.email,
      role: user.role, // Use the current role from the database for up-to-date permissions
    };
  }
} 