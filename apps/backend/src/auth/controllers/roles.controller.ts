import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RoleAssignmentService } from '../services/role-assignment.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { GetUser } from '../decorators/user.decorator';
import { Permission } from '../constants/permissions';
import { User, UserRole } from '../../database/entities/user.entity';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly roleAssignmentService: RoleAssignmentService) {}

  /**
   * Get all users with their roles
   */
  @Get('users')
  @RequirePermissions(Permission.USER_READ)
  async getUsersWithRoles() {
    const users = await this.roleAssignmentService.getUsersWithRoles();
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Users retrieved successfully',
      data: { users },
    };
  }

  /**
   * Get users by specific role
   */
  @Get('users/:role')
  @RequirePermissions(Permission.USER_READ)
  async getUsersByRole(@Param('role') role: UserRole) {
    const users = await this.roleAssignmentService.getUsersByRole(role);
    
    return {
      statusCode: HttpStatus.OK,
      message: `${role} users retrieved successfully`,
      data: { users, role },
    };
  }

  /**
   * Assign a role to a user
   */
  @Patch('assign/:userId/:newRole')
  @RequirePermissions(Permission.USER_ASSIGN_ROLES)
  async assignRole(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('newRole') newRole: UserRole,
    @GetUser() currentUser: User,
  ) {
    const updatedUser = await this.roleAssignmentService.assignRole(
      userId,
      newRole,
      currentUser,
    );

    return {
      statusCode: HttpStatus.OK,
      message: `Role ${newRole} assigned successfully`,
      data: {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
        },
      },
    };
  }

  /**
   * Get role hierarchy and descriptions
   */
  @Get('hierarchy')
  @RequirePermissions(Permission.USER_READ)
  async getRoleHierarchy() {
    const hierarchy = this.roleAssignmentService.getRoleHierarchy();
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Role hierarchy retrieved successfully',
      data: { hierarchy },
    };
  }

  /**
   * Get permissions for a specific role
   */
  @Get('permissions/:role')
  @RequirePermissions(Permission.USER_READ)
  async getRolePermissions(@Param('role') role: UserRole) {
    const permissions = this.roleAssignmentService.getRolePermissions(role);
    
    return {
      statusCode: HttpStatus.OK,
      message: `Permissions for ${role} retrieved successfully`,
      data: { role, permissions },
    };
  }

  /**
   * Get current user's permissions
   */
  @Get('my-permissions')
  async getMyPermissions(@GetUser() user: User) {
    const permissions = this.roleAssignmentService.getRolePermissions(user.role);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Your permissions retrieved successfully',
      data: {
        role: user.role,
        permissions,
      },
    };
  }

  /**
   * Check if current user can assign a specific role
   */
  @Get('can-assign/:targetRole')
  async canAssignRole(
    @Param('targetRole') targetRole: UserRole,
    @GetUser() user: User,
  ) {
    const canAssign = this.roleAssignmentService.canAssignRole(
      user.role,
      user.role, // current user role (same as assigner in this case)
      targetRole,
    );
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Role assignment permission checked',
      data: {
        canAssign,
        targetRole,
        yourRole: user.role,
      },
    };
  }
} 