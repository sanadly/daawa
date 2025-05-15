import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service'; // To potentially fetch full user object

// This matches the payload structure used in AuthService.login
interface JwtPayload {
  username: string;
  sub: number; // User ID
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
  validate(payload: JwtPayload): any {
    // Here, we could fetch the full user object from the database using payload.sub (user ID)
    // if we needed more user details than what's in the JWT payload.
    // For now, returning the payload itself is often sufficient.
    // const user = await this.usersService.findOneById(payload.sub); // Example if findOneById exists
    // if (!user) {
    //   throw new UnauthorizedException();
    // }
    // return user; // Or a stripped-down version of the user object

    // For this basic implementation, we'll return the payload directly.
    // This makes { id: payload.sub, username: payload.username } available on req.user in protected routes.
    return { userId: payload.sub, username: payload.username };
  }
} 