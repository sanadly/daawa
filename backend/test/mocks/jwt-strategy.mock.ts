import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../../src/common/decorators/roles.decorator';

const JWT_SECRET = 'test-secret-key-for-testing-only';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // Return a user object that will be added to the request
    return {
      userId: payload.userId,
      username: payload.username,
      roles: payload.roles || [Role.USER],
    };
  }
} 