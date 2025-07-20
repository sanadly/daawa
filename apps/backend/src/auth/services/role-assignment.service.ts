import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../database/entities/user.entity';
import { Permission, hasPermission } from '../constants/permissions';

@Injectable()
export class RoleAssignmentService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Assign a role to a user
   */
  async assignRole(
    userId: string,
    newRole: UserRole,
    assignedBy: User,
  ): Promise<User> {
    // Check if the assigning user has permission to assign roles
    if (!hasPermission(assignedBy.role, Permission.USER_ASSIGN_ROLES)) {
      throw new ForbiddenException(
        'You do not have permission to assign roles',
      );
    }

    // Find the target user
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate role assignment logic
    this.validateRoleAssignment(assignedBy.role, user.role, newRole);

    // Update the user's role
    user.role = newRole;
    return await this.userRepository.save(user);
  }

  /**
   * Get all users with their roles
   */
  async getUsersWithRoles(): Promise<User[]> {
    return await this.userRepository.find({
      select: ['id', 'name', 'email', 'role', 'is_active', 'created_at'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: UserRole): Promise<User[]> {
    return await this.userRepository.find({
      where: { role },
      select: ['id', 'name', 'email', 'role', 'is_active'],
    });
  }

  /**
   * Check if a user can be assigned a specific role
   */
  canAssignRole(
    assignerRole: UserRole,
    currentUserRole: UserRole,
    targetRole: UserRole,
  ): boolean {
    // Only admins can assign admin roles
    if (targetRole === UserRole.ADMIN && assignerRole !== UserRole.ADMIN) {
      return false;
    }

    // Admins can assign any role
    if (assignerRole === UserRole.ADMIN) {
      return true;
    }

    // Organizers can assign staff roles only
    if (
      (assignerRole === UserRole.INDIVIDUAL_ORGANIZER ||
        assignerRole === UserRole.COMPANY_ORGANIZER) &&
      targetRole === UserRole.STAFF
    ) {
      return true;
    }

    return false;
  }

  /**
   * Validate role assignment business logic
   */
  private validateRoleAssignment(
    assignerRole: UserRole,
    currentUserRole: UserRole,
    targetRole: UserRole,
  ): void {
    if (!this.canAssignRole(assignerRole, currentUserRole, targetRole)) {
      throw new ForbiddenException(
        `Cannot assign role ${targetRole} with your current permissions`,
      );
    }

    // Prevent self-demotion for admins
    if (
      assignerRole === UserRole.ADMIN &&
      currentUserRole === UserRole.ADMIN &&
      targetRole !== UserRole.ADMIN
    ) {
      const adminCount = this.getUsersByRole(UserRole.ADMIN);
      // This would need to be properly implemented with actual count
      // For now, we'll allow it but in production you'd want to prevent the last admin from being demoted
    }
  }

  /**
   * Get role hierarchy for display purposes
   */
  getRoleHierarchy(): Array<{ role: UserRole; level: number; description: string }> {
    return [
      {
        role: UserRole.ADMIN,
        level: 3,
        description: 'Full system access, can manage all users and settings',
      },
      {
        role: UserRole.COMPANY_ORGANIZER,
        level: 2,
        description: 'Can create and manage events for a company, assign staff roles',
      },
      {
        role: UserRole.INDIVIDUAL_ORGANIZER,
        level: 2,
        description: 'Can create and manage events as an individual, assign staff roles',
      },
      {
        role: UserRole.STAFF,
        level: 1,
        description: 'Can perform check-ins and view assigned events',
      },
    ];
  }

  /**
   * Get permissions for a specific role
   */
  getRolePermissions(role: UserRole): Permission[] {
    const { getUserPermissions } = require('../constants/permissions');
    return getUserPermissions(role);
  }
} 