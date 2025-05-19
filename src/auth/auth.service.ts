import { Injectable, UnauthorizedException, InternalServerErrorException, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserData } from '../users/user.interface';
import { v4 as uuidv4 } from 'uuid';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService
  ) {}

  async validateUser(
    emailInput: string,
    pass: string,
  ): Promise<UserData | null> {
    this.logger.debug(`======== AUTH DEBUG ========`);
    this.logger.debug(`Validating user: ${emailInput}`);
    this.logger.debug(`Password provided: ${pass ? 'Yes (length: ' + pass.length + ')' : 'No'}`);
    
    const user = await this.usersService.findOneByEmail(emailInput);
    
    if (!user) {
      this.logger.warn(`ValidateUser: User not found - ${emailInput}`);
      return null;
    }
    
    this.logger.debug(`User found: ${JSON.stringify({
      id: user.id,
      email: user.email,
      hasPassword: !!user.password,
      isEmailVerified: user.isEmailVerified,
      role: user.role
    })}`);
    
    if (!user.password) {
      this.logger.warn(`ValidateUser: User ${emailInput} has no password set.`);
      return null;
    }

    try {
      const isPasswordMatch = await bcrypt.compare(pass, user.password);
      this.logger.debug(`Password comparison result: ${isPasswordMatch}`);
      this.logger.debug(`ValidateUser for ${emailInput}: Password match result - ${isPasswordMatch}`);

      if (user && user.password && isPasswordMatch) {
        if (!user.isEmailVerified) {
          this.logger.warn(`ValidateUser: Email not verified for ${emailInput}`);
          throw new UnauthorizedException(
            'Please verify your email address before logging in.',
          );
        }
        this.logger.debug(`Authentication successful for user: ${emailInput}`);
        return { id: user.id, email: user.email, role: user.role };
      }
      this.logger.debug(`Authentication failed for user: ${emailInput} - Password mismatch`);
      return null;
    } catch (error) {
      this.logger.error(`Error during password validation: ${error.message}`);
      throw new InternalServerErrorException('Authentication error');
    }
  }

  async getTokens(userId: number, email: string, role: string) {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!jwtSecret || !jwtRefreshSecret) {
      this.logger.error('JWT secrets not configured');
      throw new InternalServerErrorException('Server configuration error');
    }

    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(
          { sub: userId, email, role },
          {
            secret: jwtSecret,
            expiresIn: '15m',
          },
        ),
        this.jwtService.signAsync(
          { sub: userId, email, role },
          {
            secret: jwtRefreshSecret,
            expiresIn: '7d',
          },
        ),
      ]);
      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error(`Error generating tokens: ${error.message}`);
      throw new InternalServerErrorException('Error generating authentication tokens');
    }
  }

  async login(user: UserData) {
    this.logger.debug(`Login - Generating tokens for user: ${user.email}, ID: ${user.id}, Role: ${user.role}`);
    
    // Generate JWT tokens
    const tokens = await this.getTokens(user.id, user.email, user.role);
    
    // Store refresh token hash
    await this.usersService.setCurrentRefreshToken(tokens.refreshToken, user.id);
    
    this.logger.debug(`Login - Tokens generated successfully for ${user.email}`);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  async register(email: string, password: string, name?: string) {
    // Check if user exists
    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate email verification token
    const verificationToken = uuidv4();

    // Create user
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      name: name || null,
      emailVerificationToken: verificationToken,
      isEmailVerified: false,
    });

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        email,
        verificationToken,
      );
    } catch (error) {
      this.logger.error(`Failed to send verification email: ${error.message}`);
      // Continue with registration even if email fails
    }

    return {
      id: user.id,
      email: user.email,
    };
  }

  async refreshToken(userId: number, refreshToken: string) {
    // Validate refresh token
    const user = await this.usersService.getUserIfRefreshTokenMatches(
      refreshToken,
      userId,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = await this.getTokens(user.id, user.email, user.role);

    // Update stored refresh token
    await this.usersService.setCurrentRefreshToken(tokens.refreshToken, user.id);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: number) {
    // Clear refresh token
    await this.usersService.setCurrentRefreshToken(null, userId);
    return { success: true };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findOneByEmailVerificationToken(token);
    
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }
    
    await this.usersService.setEmailVerified(user.id);
    return { success: true };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findOneByEmail(email);
    
    if (!user) {
      // Don't reveal if user exists
      return { success: true };
    }
    
    if (user.isEmailVerified) {
      return { success: true, message: 'Email already verified' };
    }
    
    // Generate new token
    const verificationToken = uuidv4();
    await this.usersService.updateEmailVerificationToken(
      user.id,
      verificationToken,
    );
    
    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(
        email,
        verificationToken,
      );
    } catch (error) {
      this.logger.error(`Failed to send verification email: ${error.message}`);
      throw new InternalServerErrorException('Failed to send verification email');
    }
    
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOneByEmail(email);
    
    if (!user) {
      // Don't reveal if user exists
      return { success: true };
    }
    
    // Generate token and set expiry (24 hours)
    const resetToken = uuidv4();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    
    await this.usersService.createPasswordResetToken(
      user.id,
      resetToken,
      expiry,
    );
    
    // Send email with reset link
    try {
      await this.emailService.sendPasswordResetEmail(
        email,
        resetToken,
      );
    } catch (error) {
      this.logger.error(`Failed to send password reset email: ${error.message}`);
      throw new InternalServerErrorException('Failed to send password reset email');
    }
    
    return { success: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findUserByPasswordResetToken(token);
    
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear reset tokens
    await this.usersService.updatePassword(user.id, hashedPassword);
    await this.usersService.clearPasswordResetTokensForUser(user.id);
    
    return { success: true };
  }
} 