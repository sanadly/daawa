import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UserActivity, ActivityType } from '../../database/entities/user-activity.entity';
import { UpdateProfileDto, ChangePasswordDto, UpdateAccountSettingsDto } from '../dtos/update-profile.dto';
import { PasswordService } from './password.service';

export interface ActivityLogOptions {
  userId: string;
  activityType: ActivityType;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  isSuccessful?: boolean;
  failureReason?: string;
}

export interface UserActivitySummary {
  totalActivities: number;
  recentLogins: number;
  profileUpdates: number;
  passwordChanges: number;
  failedAttempts: number;
  lastActivity: Date | null;
}

@Injectable()
export class AccountManagementService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserActivity)
    private readonly activityRepository: Repository<UserActivity>,
    private readonly passwordService: PasswordService,
  ) {}

  /**
   * Update user profile information
   */
  async updateProfile(
    userId: string,
    updateData: UpdateProfileDto,
    requestInfo?: { ipAddress?: string; userAgent?: string },
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateData.email },
      });
      if (existingUser) {
        throw new BadRequestException('Email address is already in use');
      }
      // If email is being changed, mark as unverified
      user.email_verified = false;
    }

    // Update user fields
    Object.assign(user, updateData);
    const updatedUser = await this.userRepository.save(user);

    // Log the activity
    await this.logActivity({
      userId,
      activityType: ActivityType.PROFILE_UPDATE,
      description: 'Profile information updated',
      metadata: { updatedFields: Object.keys(updateData) },
      ...requestInfo,
    });

    return updatedUser;
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
    requestInfo?: { ipAddress?: string; userAgent?: string },
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.passwordService.comparePassword(
      changePasswordDto.currentPassword,
      user.password_hash,
    );

    if (!isCurrentPasswordValid) {
      await this.logActivity({
        userId,
        activityType: ActivityType.PASSWORD_CHANGE,
        description: 'Failed password change attempt - incorrect current password',
        isSuccessful: false,
        failureReason: 'Invalid current password',
        ...requestInfo,
      });
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await this.passwordService.hashPassword(
      changePasswordDto.newPassword,
    );

    // Update password
    user.password_hash = newPasswordHash;
    await this.userRepository.save(user);

    // Log successful password change
    await this.logActivity({
      userId,
      activityType: ActivityType.PASSWORD_CHANGE,
      description: 'Password changed successfully',
      ...requestInfo,
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Deactivate user account
   */
  async deactivateAccount(
    userId: string,
    deactivatedBy: User,
    reason?: string,
    requestInfo?: { ipAddress?: string; userAgent?: string },
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.is_active) {
      throw new BadRequestException('Account is already deactivated');
    }

    // Only allow self-deactivation or admin deactivation
    if (userId !== deactivatedBy.id && deactivatedBy.role !== 'admin') {
      throw new ForbiddenException('Not authorized to deactivate this account');
    }

    user.is_active = false;
    await this.userRepository.save(user);

    // Log the activity
    await this.logActivity({
      userId,
      activityType: ActivityType.ACCOUNT_DEACTIVATION,
      description: `Account deactivated${reason ? ` - ${reason}` : ''}`,
      metadata: {
        deactivatedBy: deactivatedBy.id,
        reason,
      },
      ...requestInfo,
    });

    return { message: 'Account deactivated successfully' };
  }

  /**
   * Reactivate user account
   */
  async reactivateAccount(
    userId: string,
    reactivatedBy: User,
    requestInfo?: { ipAddress?: string; userAgent?: string },
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.is_active) {
      throw new BadRequestException('Account is already active');
    }

    // Only admins can reactivate accounts
    if (reactivatedBy.role !== 'admin') {
      throw new ForbiddenException('Not authorized to reactivate accounts');
    }

    user.is_active = true;
    await this.userRepository.save(user);

    // Log the activity
    await this.logActivity({
      userId,
      activityType: ActivityType.ACCOUNT_REACTIVATION,
      description: 'Account reactivated',
      metadata: {
        reactivatedBy: reactivatedBy.id,
      },
      ...requestInfo,
    });

    return { message: 'Account reactivated successfully' };
  }

  /**
   * Get user activity history
   */
  async getUserActivityHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<UserActivity[]> {
    return await this.activityRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId: string): Promise<UserActivitySummary> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalActivities,
      recentLogins,
      profileUpdates,
      passwordChanges,
      failedAttempts,
      lastActivityResult,
    ] = await Promise.all([
      this.activityRepository.count({ where: { user_id: userId } }),
      this.activityRepository.count({
        where: {
          user_id: userId,
          activity_type: ActivityType.LOGIN,
          created_at: this.getDateFilter(thirtyDaysAgo),
        },
      }),
      this.activityRepository.count({
        where: {
          user_id: userId,
          activity_type: ActivityType.PROFILE_UPDATE,
        },
      }),
      this.activityRepository.count({
        where: {
          user_id: userId,
          activity_type: ActivityType.PASSWORD_CHANGE,
        },
      }),
      this.activityRepository.count({
        where: {
          user_id: userId,
          activity_type: ActivityType.FAILED_LOGIN,
        },
      }),
      this.activityRepository.findOne({
        where: { user_id: userId },
        order: { created_at: 'DESC' },
      }),
    ]);

    return {
      totalActivities,
      recentLogins,
      profileUpdates,
      passwordChanges,
      failedAttempts,
      lastActivity: lastActivityResult?.created_at || null,
    };
  }

  /**
   * Log user activity
   */
  async logActivity(options: ActivityLogOptions): Promise<void> {
    const activity = this.activityRepository.create({
      user_id: options.userId,
      activity_type: options.activityType,
      description: options.description,
      ip_address: options.ipAddress,
      user_agent: options.userAgent,
      metadata: options.metadata,
      is_successful: options.isSuccessful ?? true,
      failure_reason: options.failureReason,
    });

    await this.activityRepository.save(activity);
  }

  /**
   * Get user account settings
   */
  async getAccountSettings(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'name',
        'email',
        'preferred_language',
        'phone',
        'avatar_url',
        'email_verified',
        'is_active',
        'created_at',
        'last_login_at',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Clean up old activity logs (for maintenance)
   */
  async cleanupOldActivities(daysToKeep: number = 90): Promise<{ deletedCount: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.activityRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate })
      .execute();

    return { deletedCount: result.affected || 0 };
  }

  /**
   * Helper method for date filtering
   */
  private getDateFilter(date: Date) {
    return { $gte: date } as any; // TypeORM date filtering
  }
} 