import { Controller, Post, Body, UseGuards, Get, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/user.decorator';
import { User, UserRole } from '../database/entities';
import { RegisterDto } from '../auth/dtos/register.dto';

@ApiTags('company')
@ApiBearerAuth()
@Controller('company')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post('users/register')
  @Roles(UserRole.COMPANY_ORGANIZER)
  @ApiOperation({ summary: 'Register a new staff user under the company' })
  async registerStaff(
    @Body(new ValidationPipe()) createStaffDto: Omit<RegisterDto, 'account_type' | 'role'>,
    @GetUser() companyOrganizer: User,
  ) {
    const user = await this.companyService.registerStaff(createStaffDto, companyOrganizer);
    return user;
  }

  @Get('users')
  @Roles(UserRole.COMPANY_ORGANIZER)
  @ApiOperation({ summary: 'Get all users managed by the company' })
  async getManagedUsers(@GetUser() companyOrganizer: User) {
    return this.companyService.getManagedUsers(companyOrganizer);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get company statistics including events, users, and metrics' })
  async getStats(@GetUser() companyOrganizer: User) {
    return this.companyService.getCompanyStats(companyOrganizer);
  }
}

// Public company controller for unauthenticated endpoints
@ApiTags('company-public')
@Controller('public/company')
export class CompanyPublicController {
  constructor(private readonly companyService: CompanyService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get public company statistics' })
  async getPublicStats() {
    // Return mock data for now since we don't have authentication context
    return {
      company: {
        name: 'Sample Company',
        organizer: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com'
        }
      },
      stats: {
        totalEvents: 25,
        totalGuests: 150,
        managedUsers: 8,
        eventsByStatus: {
          'upcoming': 5,
          'ongoing': 2,
          'completed': 18
        },
        guestsByRsvpStatus: {
          'confirmed': 120,
          'pending': 20,
          'declined': 10
        }
      },
      recentEvents: [
        {
          id: '1',
          name: 'Tech Conference 2024',
          status: 'upcoming',
          startDate: '2024-12-15T10:00:00Z',
          createdAt: '2024-11-01T09:00:00Z'
        },
        {
          id: '2',
          name: 'Annual Meeting',
          status: 'completed',
          startDate: '2024-11-20T14:00:00Z',
          createdAt: '2024-10-15T10:00:00Z'
        }
      ],
      lastUpdated: new Date().toISOString()
    };
  }
} 