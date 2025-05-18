import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('rbac')
@UseGuards(JwtAuthGuard, RolesGuard) // Apply both guards. JwtAuthGuard must come first to authenticate the user
export class RbacController {
  // This endpoint is accessible to users with ADMIN role
  @Get('admin')
  @Roles(Role.ADMIN)
  getAdminData(@Request() req: any) {
    return {
      message: 'This data is only accessible to ADMIN users',
      user: req.user,
      timestamp: new Date().toISOString(),
    };
  }

  // This endpoint is accessible to users with ORGANIZER or ADMIN role
  @Get('organizer')
  @Roles(Role.ORGANIZER, Role.ADMIN)
  getOrganizerData(@Request() req: any) {
    return {
      message: 'This data is accessible to ORGANIZER and ADMIN users',
      user: req.user,
      timestamp: new Date().toISOString(),
    };
  }

  // This endpoint is accessible to users with STAFF, ORGANIZER or ADMIN role
  @Get('staff')
  @Roles(Role.STAFF, Role.ORGANIZER, Role.ADMIN)
  getStaffData(@Request() req: any) {
    return {
      message: 'This data is accessible to STAFF, ORGANIZER, and ADMIN users',
      user: req.user,
      timestamp: new Date().toISOString(),
    };
  }

  // This endpoint is accessible to any authenticated user (no specific role required)
  @Get('authenticated')
  getAuthenticatedData(@Request() req: any) {
    return {
      message: 'This data is accessible to any authenticated user',
      user: req.user,
      timestamp: new Date().toISOString(),
    };
  }
} 