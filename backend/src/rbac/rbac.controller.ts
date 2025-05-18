import {
  Controller,
  Get,
  UseGuards,
  ForbiddenException,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Define interface for authenticated request with user
interface AuthRequest extends Request {
  user: {
    userId: number;
    email: string;
    role: string;
  };
}

@Controller('rbac')
export class RbacController {
  // This endpoint is accessible to users with ADMIN role
  @Get('admin')
  @UseGuards(JwtAuthGuard)
  getAdminResource(@Request() req: AuthRequest) {
    if (req.user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }
    return { message: 'Admin resource accessed successfully' };
  }

  // This endpoint is accessible to users with ORGANIZER or ADMIN role
  @Get('organizer')
  @UseGuards(JwtAuthGuard)
  getOrganizerResource(@Request() req: AuthRequest) {
    if (req.user.role !== 'ORGANIZER') {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }
    return { message: 'Organizer resource accessed successfully' };
  }

  // This endpoint is accessible to users with STAFF, ORGANIZER or ADMIN role
  @Get('staff')
  @UseGuards(JwtAuthGuard)
  getStaffResource(@Request() req: AuthRequest) {
    if (req.user.role !== 'STAFF') {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }
    return { message: 'Staff resource accessed successfully' };
  }

  // This endpoint is accessible to any authenticated user (no specific role required)
  @Get('authenticated')
  @UseGuards(JwtAuthGuard)
  getAuthenticatedResource() {
    return { message: 'Authenticated user resource accessed successfully' };
  }
} 