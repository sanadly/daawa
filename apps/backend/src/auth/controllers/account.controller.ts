import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  Req,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { AccountManagementService } from '../services/account-management.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { GetUser } from '../decorators/user.decorator';
import { Permission } from '../constants/permissions';
import { User } from '../../database/entities/user.entity';
import { UpdateProfileDto, ChangePasswordDto } from '../dtos/update-profile.dto';

@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(
    private readonly accountManagementService: AccountManagementService,
  ) {}

  /**
   * Get current user's account settings
   */
  @Get('settings')
  async getAccountSettings(@GetUser() user: User) {
    const settings = await this.accountManagementService.getAccountSettings(user.id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Account settings retrieved successfully',
      data: { settings },
    };
  }

  /**
   * Update user profile
   */
  @Patch('profile')
  async updateProfile(
    @GetUser() user: User,
    @Body(ValidationPipe) updateProfileDto: UpdateProfileDto,
    @Req() request: Request,
  ) {
    const requestInfo = {
      ipAddress: request.ip,
      userAgent: request.get('User-Agent'),
    };

    const updatedUser = await this.accountManagementService.updateProfile(
      user.id,
      updateProfileDto,
      requestInfo,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          preferred_language: updatedUser.preferred_language,
          phone: updatedUser.phone,
          avatar_url: updatedUser.avatar_url,
          email_verified: updatedUser.email_verified,
        },
      },
    };
  }

  /**
   * Change user password
   */
  @Post('change-password')
  async changePassword(
    @GetUser() user: User,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
    @Req() request: Request,
  ) {
    const requestInfo = {
      ipAddress: request.ip,
      userAgent: request.get('User-Agent'),
    };

    const result = await this.accountManagementService.changePassword(
      user.id,
      changePasswordDto,
      requestInfo,
    );

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  /**
   * Get user activity history
   */
  @Get('activity')
  async getActivityHistory(
    @GetUser() user: User,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
  ) {
    const activities = await this.accountManagementService.getUserActivityHistory(
      user.id,
      Math.min(limit, 100), // Cap at 100
      offset,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Activity history retrieved successfully',
      data: {
        activities,
        pagination: {
          limit: Math.min(limit, 100),
          offset,
          count: activities.length,
        },
      },
    };
  }

  /**
   * Get user activity summary
   */
  @Get('activity/summary')
  async getActivitySummary(@GetUser() user: User) {
    const summary = await this.accountManagementService.getUserActivitySummary(user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Activity summary retrieved successfully',
      data: { summary },
    };
  }

  /**
   * Deactivate current user's account
   */
  @Post('deactivate')
  async deactivateAccount(
    @GetUser() user: User,
    @Req() request: Request,
    @Body('reason') reason?: string,
  ) {
    const requestInfo = {
      ipAddress: request.ip,
      userAgent: request.get('User-Agent'),
    };

    const result = await this.accountManagementService.deactivateAccount(
      user.id,
      user,
      reason,
      requestInfo,
    );

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  /**
   * Admin endpoint: Get any user's account settings
   */
  @Get('admin/user/:userId/settings')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.USER_READ)
  async getAdminUserSettings(@Param('userId', ParseUUIDPipe) userId: string) {
    const settings = await this.accountManagementService.getAccountSettings(userId);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'User account settings retrieved successfully',
      data: { settings },
    };
  }

  /**
   * Admin endpoint: Get any user's activity history
   */
  @Get('admin/user/:userId/activity')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.USER_READ)
  async getAdminUserActivity(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
    @Query('offset', new ParseIntPipe({ optional: true })) offset: number = 0,
  ) {
    const activities = await this.accountManagementService.getUserActivityHistory(
      userId,
      Math.min(limit, 100),
      offset,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'User activity history retrieved successfully',
      data: {
        activities,
        pagination: {
          limit: Math.min(limit, 100),
          offset,
          count: activities.length,
        },
      },
    };
  }

  /**
   * Admin endpoint: Get any user's activity summary
   */
  @Get('admin/user/:userId/activity/summary')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.USER_READ)
  async getAdminUserActivitySummary(@Param('userId', ParseUUIDPipe) userId: string) {
    const summary = await this.accountManagementService.getUserActivitySummary(userId);

    return {
      statusCode: HttpStatus.OK,
      message: 'User activity summary retrieved successfully',
      data: { summary },
    };
  }

  /**
   * Admin endpoint: Deactivate any user's account
   */
  @Post('admin/user/:userId/deactivate')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.USER_DELETE)
  async adminDeactivateAccount(
    @Param('userId', ParseUUIDPipe) userId: string,
    @GetUser() adminUser: User,
    @Req() request: Request,
    @Body('reason') reason?: string,
  ) {
    const requestInfo = {
      ipAddress: request.ip,
      userAgent: request.get('User-Agent'),
    };

    const result = await this.accountManagementService.deactivateAccount(
      userId,
      adminUser,
      reason,
      requestInfo,
    );

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  /**
   * Admin endpoint: Reactivate any user's account
   */
  @Post('admin/user/:userId/reactivate')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.USER_UPDATE)
  async adminReactivateAccount(
    @Param('userId', ParseUUIDPipe) userId: string,
    @GetUser() adminUser: User,
    @Req() request: Request,
  ) {
    const requestInfo = {
      ipAddress: request.ip,
      userAgent: request.get('User-Agent'),
    };

    const result = await this.accountManagementService.reactivateAccount(
      userId,
      adminUser,
      requestInfo,
    );

    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }

  /**
   * Admin endpoint: Clean up old activity logs
   */
  @Delete('admin/cleanup-activities')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.SYSTEM_CONFIG)
  async cleanupOldActivities(
    @Query('daysToKeep', new ParseIntPipe({ optional: true })) daysToKeep: number = 90,
  ) {
    const result = await this.accountManagementService.cleanupOldActivities(daysToKeep);

    return {
      statusCode: HttpStatus.OK,
      message: 'Old activity logs cleaned up successfully',
      data: result,
    };
  }
} 