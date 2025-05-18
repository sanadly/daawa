import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access.
    // You might change this to deny access by default if no roles are specified.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // IMPORTANT: This assumes your AuthGuard populates request.user

    // If there's no user object, it means authentication might have failed or is missing.
    if (!user) {
      // It's generally the job of an AuthGuard to throw UnauthorizedException.
      // If RolesGuard runs and there's no user, it implies a setup issue or that AuthGuard didn't run/pass.
      throw new UnauthorizedException('User not authenticated. Cannot perform role check.');
    }

    // Access the role from the JWT payload in req.user
    const userRole = user.role;

    // If user object exists but has no role, it's an issue with user data or auth process.
    if (!userRole) {
      throw new ForbiddenException('Access Denied: User role is not defined in the JWT payload.');
    }

    const hasRequiredRole = requiredRoles.some((role) => userRole === role);

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Access Denied: Your role ('${userRole}') is not authorized. Required: ${requiredRoles.join(', ')}`,
      );
    }
    return true;
  }
} 