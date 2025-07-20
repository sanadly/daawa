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
    // Return a sanitized user object
    const { password_hash, ...result } = user;
    return result;
  }

  @Get('users')
  @Roles(UserRole.COMPANY_ORGANIZER)
  @ApiOperation({ summary: 'Get all users managed by the company' })
  async getManagedUsers(@GetUser() companyOrganizer: User) {
    return this.companyService.getManagedUsers(companyOrganizer);
  }
} 