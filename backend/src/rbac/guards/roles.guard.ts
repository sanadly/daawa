import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../constants/role.enum';
import { JwtService } from '@nestjs/jwt';

interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get the required roles for the endpoint
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;
    
    // Check if the auth header exists
    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      this.logger.error('No authorization header present');
      throw new UnauthorizedException('Authorization header missing');
    }

    try {
      // Extract the token and verify it
      const token = authHeader.split(' ')[1];
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      
      // Set the user on the request
      request.user = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role
      };

      this.logger.debug(`User role from token: ${payload.role}, Required roles: ${requiredRoles.join(', ')}`);

      // Check if user exists and has a role
      if (!request.user || !request.user.role) {
        this.logger.error('User not authenticated in request');
        throw new UnauthorizedException('User not authenticated. Cannot perform role check.');
      }

      // Check if the user has the required role
      const hasRole = requiredRoles.some(role => request.user.role === role);
      
      if (!hasRole) {
        this.logger.warn(`User with role ${request.user.role} tried to access route requiring roles ${requiredRoles.join(', ')}`);
        throw new ForbiddenException('You do not have permission to access this resource');
      }
      
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`JWT verification failed: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
} 