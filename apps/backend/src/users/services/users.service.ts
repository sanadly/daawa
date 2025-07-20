import { Injectable, ConflictException, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { RegisterDto } from '../../auth/dtos/register.dto';
import { PasswordService } from '../../auth/services/password.service';
import { ImageProcessingService } from '../../storage/services/image-processing.service';
import { SecureUrlService } from '../../storage/services/secure-url.service';
import { IStorageService, StorageFile } from '../../storage/interfaces/storage.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
    @Inject('IStorageService') private readonly storageService: IStorageService,
    private readonly imageProcessingService: ImageProcessingService,
    private readonly secureUrlService: SecureUrlService,
  ) {}

  /**
   * Register a new user
   */
  async registerUser(registerDto: RegisterDto): Promise<User> {
    const { email, password, confirmPassword, name, role, preferred_language, phone } = registerDto;

    // Check if passwords match
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Validate password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash the password
    const hashedPassword = await this.passwordService.hashPassword(password);

    // Create new user
    const user = this.userRepository.create({
      email,
      password_hash: hashedPassword,
      name,
      role,
      preferred_language: preferred_language || 'en',
      phone,
      is_active: true,
      email_verified: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Save user to database
    const savedUser = await this.userRepository.save(user);

    // Remove sensitive data before returning
    delete savedUser.password_hash;
    
    return savedUser;
  }

  /**
   * Find user by email for authentication
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (user) {
      delete user.password_hash;
    }

    return user;
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      last_login_at: new Date(),
      updated_at: new Date(),
    });
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userRepository.count({
      where: { email: email.toLowerCase() },
    });
    return count > 0;
  }

  /**
   * Activate user account
   */
  async activateUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.update(userId, {
      is_active: true,
      email_verified: true,
      updated_at: new Date(),
    });
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.update(userId, {
      is_active: false,
      updated_at: new Date(),
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: Partial<User>): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove sensitive fields that shouldn't be updated this way
    delete updateData.password_hash;
    delete updateData.id;
    delete updateData.created_at;

    await this.userRepository.update(userId, {
      ...updateData,
      updated_at: new Date(),
    });

    return this.findById(userId);
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.passwordService.comparePassword(
      currentPassword,
      user.password_hash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Validate new password strength
    const passwordValidation = this.passwordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new BadRequestException(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash new password
    const hashedNewPassword = await this.passwordService.hashPassword(newPassword);

    // Update password
    await this.userRepository.update(userId, {
      password_hash: hashedNewPassword,
      updated_at: new Date(),
    });
  }

  /**
   * Update user password directly (used for password reset)
   */
  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update password directly with already hashed password
    await this.userRepository.update(userId, {
      password_hash: hashedPassword,
      updated_at: new Date(),
    });
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    verified: number;
    unverified: number;
  }> {
    const [total, active, verified] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { is_active: true } }),
      this.userRepository.count({ where: { email_verified: true } }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      verified,
      unverified: total - verified,
    };
  }

  /**
   * Upload and set user avatar
   */
  async uploadAvatar(userId: string, file: StorageFile): Promise<{ avatarUrl: string; thumbnails: any; responsiveUrls: any }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate file is an image
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // Delete old avatar if exists
    if (user.avatar_url) {
      await this.deleteAvatar(userId);
    }

    try {
      // Process the image with optimized settings for avatars
      const processedImage = await this.imageProcessingService.processImage(
        file,
        {
          width: 400,
          height: 400,
          quality: 85,
          format: 'webp',
          fit: 'cover',
        },
        `avatars/${userId}`,
      );

      const avatarUrl = processedImage.formats.webp?.url || processedImage.original.url;

      // Update user with new avatar URL
      await this.userRepository.update(userId, {
        avatar_url: avatarUrl,
        updated_at: new Date(),
      });

      // Get responsive URLs for the avatar
      const responsiveUrls = this.storageService.getResponsiveImageUrls(
        processedImage.formats.webp?.key || processedImage.original.key
      );

      // Invalidate CDN cache for user avatar
      await this.storageService.invalidateUserAvatar(userId);

      return {
        avatarUrl,
        thumbnails: processedImage.thumbnails,
        responsiveUrls,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete user avatar
   */
  async deleteAvatar(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.avatar_url) {
      return; // No avatar to delete
    }

    try {
      // Extract key from URL for deletion
      const urlParts = user.avatar_url.split('/');
      const keyIndex = urlParts.findIndex(part => part === 'avatars');
      if (keyIndex !== -1) {
        const key = urlParts.slice(keyIndex).join('/');
        
        // Delete all avatar files (original, processed, thumbnails)
        const filesToDelete = await this.storageService.listFiles(`avatars/${userId}`);
        if (filesToDelete.length > 0) {
          await this.storageService.deleteMultiple(filesToDelete, 'daawa-processed-images');
        }
      }

      // Invalidate CDN cache for user avatar
      await this.storageService.invalidateUserAvatar(userId);

      // Update user to remove avatar URL
      await this.userRepository.update(userId, {
        avatar_url: null,
        updated_at: new Date(),
      });
    } catch (error) {
      // Log error but don't throw - we still want to clear the URL from database
      console.error('Failed to delete avatar files:', error);
      
      // Clear avatar URL from database anyway
      await this.userRepository.update(userId, {
        avatar_url: null,
        updated_at: new Date(),
      });
    }
  }

  /**
   * Get user avatar URL with CDN optimization
   */
  async getAvatarUrl(userId: string, version?: string): Promise<string | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['avatar_url'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.avatar_url) {
      return null;
    }

    // If version is provided, get cache-optimized URL
    if (version) {
      const urlParts = user.avatar_url.split('/');
      const keyIndex = urlParts.findIndex(part => part === 'avatars');
      if (keyIndex !== -1) {
        const key = urlParts.slice(keyIndex).join('/');
        return this.storageService.getCacheOptimizedUrl(key, version);
      }
    }

    return user.avatar_url;
  }

  /**
   * Get responsive avatar URLs for different formats and sizes
   */
  async getAvatarResponsiveUrls(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['avatar_url'],
    });

    if (!user || !user.avatar_url) {
      return null;
    }

    try {
      // Extract key from URL
      const urlParts = user.avatar_url.split('/');
      const keyIndex = urlParts.findIndex(part => part === 'avatars');
      if (keyIndex !== -1) {
        const key = urlParts.slice(keyIndex).join('/');
        return this.storageService.getResponsiveImageUrls(key);
      }
    } catch (error) {
      console.error('Failed to get responsive URLs for avatar:', error);
    }

    return { original: user.avatar_url };
  }

  /**
   * Generate avatar presigned URL for secure access
   */
  async getAvatarPresignedUrl(userId: string, expiresIn = 3600): Promise<string | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['avatar_url'],
    });

    if (!user || !user.avatar_url) {
      return null;
    }

    try {
      // Extract key from URL
      const urlParts = user.avatar_url.split('/');
      const keyIndex = urlParts.findIndex(part => part === 'avatars');
      if (keyIndex !== -1) {
        const key = urlParts.slice(keyIndex).join('/');
        return await this.storageService.getPresignedUrl(key, {
          bucket: 'daawa-processed-images',
          expiresIn,
        });
      }
    } catch (error) {
      console.error('Failed to generate presigned URL for avatar:', error);
    }

    return user.avatar_url; // Fallback to public URL
  }

  /**
   * Generate secure avatar URL with token-based access
   */
  async getAvatarSecureUrl(
    userId: string, 
    requestingUserId?: string,
    expiresIn = 3600,
    maxDownloads?: number
  ): Promise<{
    secureUrl: string;
    directUrl?: string;
    expiresAt: Date;
    token: string;
  } | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['avatar_url'],
    });

    if (!user || !user.avatar_url) {
      return null;
    }

    try {
      // Extract key from URL
      const urlParts = user.avatar_url.split('/');
      const keyIndex = urlParts.findIndex(part => part === 'avatars');
      if (keyIndex !== -1) {
        const key = urlParts.slice(keyIndex).join('/');
        
        return await this.secureUrlService.generateSecureUrl(key, {
          expiresIn,
          userId: requestingUserId,
          resourceType: 'avatar',
          permissions: ['read'],
          maxDownloads,
        });
      }
    } catch (error) {
      console.error('Failed to generate secure URL for avatar:', error);
    }

    return null;
  }

  /**
   * Generate secure responsive avatar URLs
   */
  async getAvatarSecureResponsiveUrls(
    userId: string,
    requestingUserId?: string,
    expiresIn = 3600,
    maxDownloads?: number
  ): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['avatar_url'],
    });

    if (!user || !user.avatar_url) {
      return null;
    }

    try {
      // Extract key from URL
      const urlParts = user.avatar_url.split('/');
      const keyIndex = urlParts.findIndex(part => part === 'avatars');
      if (keyIndex !== -1) {
        const key = urlParts.slice(keyIndex).join('/');
        
        return await this.secureUrlService.generateSecureResponsiveUrls(key, {
          expiresIn,
          userId: requestingUserId,
          resourceType: 'avatar',
          permissions: ['read'],
          maxDownloads,
        });
      }
    } catch (error) {
      console.error('Failed to generate secure responsive URLs for avatar:', error);
    }

    return null;
  }
} 