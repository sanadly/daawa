import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, hasPermission } from '../constants/permissions';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user || !user.role) {
      return false;
    }

    // Check if user has ALL required permissions
    return requiredPermissions.every((permission) =>
      hasPermission(user.role, permission),
    );
  }
} 