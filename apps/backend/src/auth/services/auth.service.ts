import {
  Injectable,
  UnauthorizedException,
  Logger,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterDto } from '../dtos/register.dto';
import { JwtService } from './jwt.service';
import { User, UserRole } from '../../database/entities/user.entity';
import { PasswordService } from './password.service';
import { ConfigService } from '@nestjs/config';
import { ROLE_PERMISSIONS } from '../constants/permissions';
import { LoginDto } from '../dtos/login.dto';
import { UsersService } from '../../users/services/users.service';
import { PasswordResetToken } from '../../database/entities/password-reset-token.entity';
import { UserActivity, ActivityType } from '../../database/entities/user-activity.entity';
import * as crypto from 'crypto';
import { PasswordResetRequestDto } from '../dtos/password-reset-request.dto';
import { PasswordResetConfirmDto } from '../dtos/password-reset-confirm.dto';

export interface AuthResponse {
  user: Partial<User>;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    @InjectRepository(UserActivity)
    private readonly userActivityRepository: Repository<UserActivity>,
    private readonly usersService: UsersService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getPublicUser(user: User): Partial<User> {
    const { password_hash, ...publicUser } = user;
    return publicUser;
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, name, phone, role, preferred_language } = registerDto;
    
    if (await this.usersService.existsByEmail(email)) {
      throw new ConflictException('User with this email already exists');
      }

    const hashedPassword = await this.passwordService.hashPassword(password);
    const user = this.userRepository.create({
      email,
      password_hash: hashedPassword,
      name,
      phone,
      role: role || UserRole.STAFF,
      preferred_language: preferred_language || 'en',
      is_active: true,
    });
    const savedUser = await this.userRepository.save(user);

    const permissions = ROLE_PERMISSIONS[savedUser.role] || [];
    const tokens = await this.jwtService.generateTokens(savedUser, permissions);

      return {
      user: this.getPublicUser(savedUser),
        tokens,
      };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user || !user.is_active || !(await this.passwordService.comparePassword(password, user.password_hash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    user.last_login_at = new Date();
    await this.userRepository.save(user);

    const permissions = ROLE_PERMISSIONS[user.role] || [];
    const tokens = await this.jwtService.generateTokens(user, permissions);

    return {
      user: this.getPublicUser(user),
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = await this.jwtService.verifyToken(refreshToken);
      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.is_active) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const permissions = ROLE_PERMISSIONS[user.role] || [];
      const tokens = await this.jwtService.generateTokens(user, permissions);

      return {
        user: this.getPublicUser(user),
        tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    this.logActivity(userId, ActivityType.LOGOUT, 'User logged out successfully');
  }

  /**
   * Verify if user exists and is active
   */
  async verifyUserExists(email: string): Promise<boolean> {
    const user = await this.usersService.findByEmail(email);
    return user ? user.is_active : false;
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string): Promise<User> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: Partial<User>): Promise<User> {
    return this.usersService.updateProfile(userId, updateData);
  }

  /**
   * Change password with enhanced security validation
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    // Validate new password strength
    const validation = this.passwordService.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Password does not meet security requirements',
        errors: validation.errors,
        strength: validation.strength,
      });
    }

    // Check if password is being reused
    const isReused = await this.passwordService.isPasswordReused(userId, newPassword);
    if (isReused) {
      throw new BadRequestException('This password has been used recently. Please choose a different password.');
    }

    // Change password using UsersService
    await this.usersService.changePassword(userId, currentPassword, newPassword);

    // Store new password in history after successful change
    const user = await this.usersService.findById(userId);
    if (user) {
      await this.passwordService.storePasswordInHistory(userId, user.password_hash);
    }

    return { message: 'Password changed successfully' };
  }

  /**
   * Request password reset - Generate and store secure token
   */
  async requestPasswordReset(requestDto: PasswordResetRequestDto, ipAddress?: string, userAgent?: string): Promise<{ message: string }> {
    const { email } = requestDto;

    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // For security, don't reveal if email exists or not
      return { message: 'If the email exists in our system, you will receive a password reset link shortly.' };
    }

    // Check if user is active
    if (!user.is_active) {
      return { message: 'If the email exists in our system, you will receive a password reset link shortly.' };
    }

    // Invalidate any existing unused tokens for this user
    await this.passwordResetTokenRepository.update(
      { user_id: user.id, is_used: false },
      { is_used: true, used_at: new Date() }
    );

    // Generate secure random token (32 bytes = 256 bits)
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiration time (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Create and save reset token
    const resetToken = this.passwordResetTokenRepository.create({
      token,
      user_id: user.id,
      expires_at: expiresAt,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    await this.passwordResetTokenRepository.save(resetToken);

    // TODO: Send email with reset link
    // For now, we'll just log the token (in production, remove this)
    console.log(`Password reset token for ${email}: ${token}`);
    console.log(`Reset link: http://localhost:3000/reset-password?token=${token}`);

    return { message: 'If the email exists in our system, you will receive a password reset link shortly.' };
  }

  /**
   * Confirm password reset - Validate token and update password
   */
  async confirmPasswordReset(confirmDto: PasswordResetConfirmDto, ipAddress?: string, userAgent?: string): Promise<{ message: string }> {
    const { token, newPassword } = confirmDto;

    // Find valid, unused, non-expired token
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: {
        token,
        is_used: false,
      },
      relations: ['user'],
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token has expired
    if (new Date() > resetToken.expires_at) {
      // Mark as used to prevent reuse
      await this.passwordResetTokenRepository.update(resetToken.id, {
        is_used: true,
        used_at: new Date(),
      });
      throw new BadRequestException('Reset token has expired');
    }

    // Check if user still exists and is active
    if (!resetToken.user || !resetToken.user.is_active) {
      throw new BadRequestException('User account is not available');
    }

    try {
      // Validate new password strength
      const validation = this.passwordService.validatePasswordStrength(newPassword);
      if (!validation.isValid) {
        throw new BadRequestException({
          message: 'Password does not meet security requirements',
          errors: validation.errors,
          strength: validation.strength,
        });
      }

      // Check if password is being reused
      const isReused = await this.passwordService.isPasswordReused(resetToken.user.id, newPassword);
      if (isReused) {
        throw new BadRequestException('This password has been used recently. Please choose a different password.');
      }

      // Hash the new password
      const hashedPassword = await this.passwordService.hashPassword(newPassword);

      // Update user's password
      await this.usersService.updatePassword(resetToken.user.id, hashedPassword);

      // Store new password in history
      await this.passwordService.storePasswordInHistory(resetToken.user.id, hashedPassword);

      // Mark token as used
      await this.passwordResetTokenRepository.update(resetToken.id, {
        is_used: true,
        used_at: new Date(),
        ip_address: ipAddress,
        user_agent: userAgent,
      });

      // Invalidate any other unused tokens for this user
      await this.passwordResetTokenRepository
        .createQueryBuilder()
        .update(PasswordResetToken)
        .set({ is_used: true, used_at: new Date() })
        .where('user_id = :userId', { userId: resetToken.user.id })
        .andWhere('is_used = :isUsed', { isUsed: false })
        .andWhere('id != :currentTokenId', { currentTokenId: resetToken.id })
        .execute();

      return { message: 'Password has been reset successfully. You can now log in with your new password.' };
    } catch (error) {
      throw new BadRequestException('Failed to reset password. Please try again.');
    }
  }

  /**
   * Validate password reset token (for frontend verification)
   */
  async validatePasswordResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: {
        token,
        is_used: false,
      },
      relations: ['user'],
    });

    if (!resetToken || new Date() > resetToken.expires_at || !resetToken.user?.is_active) {
      return { valid: false };
    }

    return {
      valid: true,
      email: resetToken.user.email,
    };
  }

  /**
   * Log user activity
   */
  private async logActivity(userId: string, type: ActivityType, description: string) {
         const activity = this.userActivityRepository.create({
       user_id: userId,
       activity_type: type,
       description: description,
     });
    await this.userActivityRepository.save(activity);
  }

  async validateUser(payload: any): Promise<User> {
    const user = await this.userRepository.findOne({ 
      where: { id: payload.sub },
      select: ['id', 'email', 'name', 'role', 'is_active', 'preferred_language']
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      select: ['role']
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return ROLE_PERMISSIONS[user.role] || [];
  }
} 