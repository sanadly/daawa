import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Request,
  Patch,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { PasswordResetRequestDto } from './dtos/password-reset-request.dto';
import { PasswordResetConfirmDto } from './dtos/password-reset-confirm.dto';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { GetUser } from './decorators/user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { User, UserRole } from '../database/entities/user.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   */
  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    this.logger.log(`Registration attempt for email: ${registerDto.email}`);
    const result = await this.authService.register(registerDto);
    return {
      success: true,
      message: 'User registered successfully',
      data: result,
    };
  }

  /**
   * Login user
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    this.logger.log(`Login attempt for email: ${loginDto.email}`);
    const result = await this.authService.login(loginDto);
    return {
      success: true,
      message: 'Login successful',
      data: result,
    };
  }

  /**
   * Refresh access token
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body('refreshToken') refreshToken: string) {
    const result = await this.authService.refreshToken(refreshToken);
    return {
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    };
  }

  /**
   * Get current user profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@Request() req: any) {
    return {
      success: true,
      data: req.user,
    };
  }

  /**
   * Update user profile
   */
  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(
    @GetUser() user: User,
    @Body() updateData: Partial<User>,
  ) {
    const updatedUser = await this.authService.updateProfile(user.id, updateData);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    };
  }

  /**
   * Change password
   */
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @GetUser() user: User,
    @Body() changePasswordDto: {
      currentPassword: string;
      newPassword: string;
    },
  ) {
    const result = await this.authService.changePassword(
      user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  /**
   * Logout user
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Request() req: any) {
    const user = req.user;
    this.logger.log(`Logout for user: ${user.id}`);
    await this.authService.logout(user.id);
    return {
      success: true,
      message: 'Logout successful',
    };
  }

  /**
   * Admin-only endpoint - RBAC demonstration
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/dashboard')
  async getAdminDashboard(@GetUser() user: User) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Admin dashboard accessed successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        adminStats: {
          totalUsers: 'This would contain actual admin data',
          systemHealth: 'OK',
        },
      },
    };
  }

  /**
   * Organizer and Admin only endpoint - RBAC demonstration
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COMPANY_ORGANIZER, UserRole.INDIVIDUAL_ORGANIZER)
  @Get('events/manage')
  async getEventManagement(@GetUser() user: User) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Event management accessed successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
        permissions: ['create_events', 'edit_events', 'manage_guests'],
      },
    };
  }

  /**
   * All authenticated users endpoint - No specific role required
   */
  @UseGuards(JwtAuthGuard)
  @Get('user/activities')
  async getUserActivities(@GetUser() user: User) {
    return {
      statusCode: HttpStatus.OK,
      message: 'User activities retrieved successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
        activities: ['This would contain user-specific activity data'],
      },
    };
  }

  /**
   * Health check endpoint (no database required)
   */
  @Public()
  @Get('health')
  async healthCheck() {
    return {
      statusCode: HttpStatus.OK,
      message: 'Auth module is working',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verify if email exists
   */
  @Public()
  @Post('verify-email')
  async verifyEmail(@Body('email') email: string) {
    const exists = await this.authService.verifyUserExists(email);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Email verification completed',
      data: { exists },
    };
  }

  /**
   * Request password reset
   */
  @Public()
  @Post('forgot-password')
  async requestPasswordReset(
    @Body(ValidationPipe) requestDto: PasswordResetRequestDto,
    @Request() req,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const result = await this.authService.requestPasswordReset(requestDto, ipAddress, userAgent);
    
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  /**
   * Confirm password reset
   */
  @Public()
  @Post('reset-password')
  async confirmPasswordReset(
    @Body(ValidationPipe) confirmDto: PasswordResetConfirmDto,
    @Request() req,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const result = await this.authService.confirmPasswordReset(confirmDto, ipAddress, userAgent);
    
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  /**
   * Validate password reset token
   */
  @Public()
  @Post('validate-reset-token')
  async validateResetToken(@Body('token') token: string) {
    const result = await this.authService.validatePasswordResetToken(token);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Token validation completed',
      data: result,
    };
  }
} 