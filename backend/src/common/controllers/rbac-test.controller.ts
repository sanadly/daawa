import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../decorators/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { Permissions, Permission } from '../decorators/permissions.decorator';

// Define a type for the authenticated request
interface RequestWithUser extends Request {
  user: {
    userId: number;
    username: string;
    roles: Role[];
  };
}

@Controller('rbac-test')
export class RbacTestController {
  
  @Get('public')
  public(): string {
    return 'This endpoint is public and does not require authentication';
  }
  
  @Get('authenticated')
  @UseGuards(JwtAuthGuard)
  authenticated(@Request() req: RequestWithUser): any {
    return {
      message: 'This endpoint requires authentication',
      user: req.user,
    };
  }
  
  @Get('staff')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STAFF, Role.ORGANIZER, Role.ADMIN)
  staffAccess(@Request() req: RequestWithUser): any {
    return {
      message: 'This endpoint requires STAFF, ORGANIZER, or ADMIN role',
      user: req.user,
    };
  }
  
  @Get('organizer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  organizerAccess(@Request() req: RequestWithUser): any {
    return {
      message: 'This endpoint requires ORGANIZER or ADMIN role',
      user: req.user,
    };
  }
  
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  adminAccess(@Request() req: RequestWithUser): any {
    return {
      message: 'This endpoint requires ADMIN role',
      user: req.user,
    };
  }

  @Get('view-events')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.VIEW_EVENTS)
  viewEventsAccess(@Request() req: RequestWithUser): any {
    return {
      message: 'This endpoint requires VIEW_EVENTS permission',
      user: req.user,
    };
  }

  @Get('manage-events')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_EVENTS)
  manageEventsAccess(@Request() req: RequestWithUser): any {
    return {
      message: 'This endpoint requires MANAGE_EVENTS permission',
      user: req.user,
    };
  }

  @Get('admin-operations')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CONFIGURE_SYSTEM, Permission.MANAGE_USERS)
  adminOperationsAccess(@Request() req: RequestWithUser): any {
    return {
      message: 'This endpoint requires CONFIGURE_SYSTEM and MANAGE_USERS permissions',
      user: req.user,
    };
  }

  @Get('combined-auth')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.ORGANIZER, Role.ADMIN)
  @Permissions(Permission.MANAGE_EVENTS)
  combinedAuthAccess(@Request() req: RequestWithUser): any {
    return {
      message: 'This endpoint requires both role and permission checks',
      user: req.user,
    };
  }
} 