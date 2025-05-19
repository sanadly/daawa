import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client'; // User import removed, DEFAULT_JWT_SECRET removed

// This matches the payload structure used in AuthService.login
interface JwtPayload {
  sub: number; // User ID
  email: string; // User email
  role: Role; // User role - Role enum now imported
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret || 'Aachen##2024-DefaultSecret', // Fallback for safety
    });

    if (!jwtSecret) {
      this.logger.warn(
        'JWT_SECRET not found in environment, using default secret. This is NOT secure for production!',
      );
    }

    this.logger.debug(
      `Initializing JWT strategy with secret of length: ${(jwtSecret || 'Aachen##2024-DefaultSecret').length}`,
    );
  }

  // Passport first verifies the JWT's signature and expiration using the secretOrKey.
  // If valid, this validate method is called with the decoded JSON as its single argument.
  async validate(payload: JwtPayload): Promise<any> {
    this.logger.debug(`Validating JWT payload for user ID: ${payload.sub}`);
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        this.logger.warn(
          `User with ID ${payload.sub} not found during JWT validation`,
        );
        throw new UnauthorizedException('User not found');
      }

      if (!user.isEmailVerified) {
        this.logger.warn(`User ${user.email} has not verified their email.`);
        // Depending on policy, you might allow access or throw an error
        // For now, let's allow access but this could be a point of stricter enforcement
        // throw new UnauthorizedException('Email not verified');
      }

      this.logger.debug(`JWT validation successful for user: ${user.email}`);
      // Remove sensitive data
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user;

      // Construct the object to be attached to req.user
      // It must match what RoleManagementController expects (i.e., with a 'roles' array)
      return {
        ...userWithoutPassword, // Spread all properties from the user object (id, email, name, role, etc.)
        roles: [user.role],
      };
    } catch (error) {
      this.logger.error(
        `JWT validation error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new UnauthorizedException('Invalid token or user not found');
    }
  }
} 