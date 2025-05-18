import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { Permissions, Permission } from '../common/decorators/permissions.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN)
export class AdminController {
  @Get('dashboard')
  getDashboard() {
    return {
      message: 'Admin dashboard',
      stats: {
        users: 1250,
        events: 45,
        tickets: 3200,
        revenue: 75000,
      },
    };
  }

  @Get('users')
  @Permissions(Permission.MANAGE_USERS)
  getAllUsers() {
    return {
      message: 'Admin users list',
      users: [
        { id: 1, name: 'User 1', role: 'ADMIN' },
        { id: 2, name: 'User 2', role: 'ORGANIZER' },
        { id: 3, name: 'User 3', role: 'STAFF' },
        { id: 4, name: 'User 4', role: 'USER' },
      ],
    };
  }

  @Get('users/:id')
  @Permissions(Permission.MANAGE_USERS)
  getUserById(@Param('id') id: string) {
    return {
      message: `Admin get user by id: ${id}`,
      user: { id: parseInt(id), name: `User ${id}`, role: 'USER' },
    };
  }

  @Put('users/:id')
  @Permissions(Permission.MANAGE_USERS)
  updateUser(@Param('id') id: string, @Body() userData: any) {
    return {
      message: `Admin update user: ${id}`,
      user: { id: parseInt(id), ...userData },
    };
  }

  @Delete('users/:id')
  @Permissions(Permission.MANAGE_USERS)
  deleteUser(@Param('id') id: string) {
    return {
      message: `Admin delete user: ${id}`,
      success: true,
    };
  }

  @Get('settings')
  @Permissions(Permission.CONFIGURE_SYSTEM)
  getSettings() {
    return {
      message: 'Admin settings',
      settings: {
        siteName: 'Event Platform',
        theme: 'dark',
        features: {
          registration: true,
          payments: true,
          messaging: true,
        },
      },
    };
  }

  @Put('settings')
  @Permissions(Permission.CONFIGURE_SYSTEM)
  updateSettings(@Body() settingsData: any) {
    return {
      message: 'Admin update settings',
      settings: settingsData,
    };
  }

  @Get('logs')
  @Permissions(Permission.VIEW_LOGS)
  getLogs() {
    return {
      message: 'Admin logs',
      logs: [
        { timestamp: new Date(), level: 'info', message: 'User logged in' },
        { timestamp: new Date(), level: 'error', message: 'Payment failed' },
        { timestamp: new Date(), level: 'warn', message: 'Rate limit reached' },
      ],
    };
  }
} 