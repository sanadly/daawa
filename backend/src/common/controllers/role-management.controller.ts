import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Put,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../decorators/roles.decorator';
import { PermissionsService } from '../services/permissions.service';
import { Permission, Permissions } from '../decorators/permissions.decorator';
import { PermissionsGuard } from '../guards/permissions.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

// Define the type for the request with user
interface RequestWithUser extends Request {
  user: {
    roles: Role[];
    [key: string]: any;
  };
}

// DTO for updating user roles
class UpdateUserRoleDto {
  role!: Role;
}

@Controller('role-management')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class RoleManagementController {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly prismaService: PrismaService,
  ) {}

  /**
   * Get all available roles
   */
  @Get('roles')
  @Roles(Role.ADMIN)
  @Permissions(Permission.MANAGE_USERS)
  getAllRoles() {
    return Object.values(Role);
  }

  /**
   * Get all available permissions
   */
  @Get('permissions')
  @Roles(Role.ADMIN)
  @Permissions(Permission.MANAGE_USERS)
  getAllPermissions() {
    return this.permissionsService.getAllAvailablePermissions();
  }

  /**
   * Get permissions for a specific role
   */
  @Get('roles/:role/permissions')
  @Roles(Role.ADMIN)
  @Permissions(Permission.MANAGE_USERS)
  getPermissionsForRole(@Param('role') role: string) {
    // Validate that the role exists
    if (!Object.values(Role).includes(role as Role)) {
      throw new NotFoundException(`Role '${role}' not found`);
    }

    return this.permissionsService.getPermissionsForRole(role as Role);
  }

  /**
   * Get all permission groups
   */
  @Get('permission-groups')
  @Roles(Role.ADMIN)
  @Permissions(Permission.MANAGE_USERS)
  getPermissionGroups() {
    return this.permissionsService.getPermissionGroups();
  }

  /**
   * Get all users with their roles
   */
  @Get('users')
  @Roles(Role.ADMIN)
  @Permissions(Permission.MANAGE_USERS)
  async getUsersWithRoles() {
    const users = await this.prismaService.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return users;
  }

  /**
   * Update user role
   */
  @Put('users/:userId/role')
  @Roles(Role.ADMIN)
  @Permissions(Permission.MANAGE_USERS)
  async updateUserRole(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    // Check if the role is valid
    if (!Object.values(Role).includes(updateUserRoleDto.role)) {
      throw new BadRequestException(`Invalid role: ${updateUserRoleDto.role}`);
    }

    // Check if the user exists
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Update the user's role
    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: { role: updateUserRoleDto.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return updatedUser;
  }

  /**
   * Get current user's permissions
   */
  @Get('my-permissions')
  @UseGuards(JwtAuthGuard)
  getMyPermissions(@Req() req: RequestWithUser) {
    if (!req.user || !req.user.roles) {
      throw new ForbiddenException('User not authenticated or missing roles');
    }

    const userRoles = req.user.roles;
    const permissions = this.permissionsService.getAllPermissionsForRoles(userRoles);
    
    return {
      roles: userRoles,
      permissions,
    };
  }
} 