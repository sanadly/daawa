import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User as PrismaUser, Role } from '../../generated/prisma';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';

type UserData = Pick<PrismaUser, 'id' | 'email' | 'role'>;

export interface Tokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse extends Tokens {
  user: UserData;
}

export interface AuthRegisterDto {
  email: string;
  password: string;
  name?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async validateUser(
    emailInput: string,
    pass: string,
  ): Promise<UserData | null> {
    this.logger.debug(`Validating user: ${emailInput}`);
    const user = await this.usersService.findOneByEmail(emailInput);

    if (!user) {
      this.logger.warn(`ValidateUser: User not found - ${emailInput}`);
      return null;
    }
    if (!user.password) {
      this.logger.warn(`ValidateUser: User ${emailInput} has no password set.`);
      return null;
    }

    const isPasswordMatch = await bcrypt.compare(pass, user.password);
    this.logger.debug(`ValidateUser for ${emailInput}: Password match result - ${isPasswordMatch}`);

    if (user && user.password && isPasswordMatch) {
      if (!user.isEmailVerified) {
        this.logger.warn(`ValidateUser: Email not verified for ${emailInput}`);
        throw new UnauthorizedException(
          'Please verify your email address before logging in.',
        );
      }
      return { id: user.id, email: user.email, role: user.role };
    }
    return null;
  }

  private async getTokens(userId: number, email: string, userRole: Role): Promise<Tokens> {
    const jwtPayload = {
      sub: userId,
      email: email,
      role: userRole,
    };

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtExpiresIn =
      this.configService.get<string>('JWT_EXPIRES_IN') || '3600s';
    const jwtRefreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET');
    const jwtRefreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    if (!jwtSecret || !jwtRefreshSecret) {
      this.logger.error('JWT signing secrets are not configured properly.');
      throw new InternalServerErrorException('Error generating tokens.');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: jwtSecret,
        expiresIn: jwtExpiresIn,
      }),
      this.jwtService.signAsync({ sub: userId }, {
        secret: jwtRefreshSecret,
        expiresIn: jwtRefreshExpiresIn,
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async login(user: UserData): Promise<LoginResponse> {
    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.usersService.setCurrentRefreshToken(
      tokens.refresh_token,
      user.id,
    );
    return {
      ...tokens,
      user,
    };
  }

  async register(authRegisterDto: AuthRegisterDto): Promise<UserData> {
    const { email, password, name } = authRegisterDto;

    const existingUserByEmail = await this.usersService.findOneByEmail(email);
    if (existingUserByEmail) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const createUserData = {
      email,
      password: hashedPassword,
      name: name || null,
      emailVerificationToken,
      isEmailVerified: false,
    };

    const userEntity = await this.usersService.create(createUserData);

    if (!userEntity) {
      this.logger.error('User creation failed to return an entity.');
      throw new InternalServerErrorException('User registration failed.');
    }

    try {
      await this.emailService.sendVerificationEmail(
        userEntity.email,
        userEntity.name || userEntity.email,
        emailVerificationToken,
      );
      this.logger.log(
        `Verification email process initiated for ${userEntity.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${userEntity.email}`,
        error instanceof Error ? error.stack : String(error),
      );
    }

    return {
      id: userEntity.id,
      email: userEntity.email,
      role: userEntity.role,
    };
  }

  async refreshToken(userId: number, rt: string): Promise<Tokens> {
    const user = await this.usersService.getUserIfRefreshTokenMatches(
      rt,
      userId,
    );
    if (!user) {
      throw new UnauthorizedException(
        'Access Denied: Invalid refresh token or user mismatch',
      );
    }
    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.usersService.setCurrentRefreshToken(
      tokens.refresh_token,
      user.id,
    );
    return tokens;
  }

  async logout(userId: number): Promise<{ message: string }> {
    await this.usersService.setCurrentRefreshToken(null, userId);
    return { message: 'Logout successful' };
  }

  async verifyEmail(token: string): Promise<{ message: string; user?: UserData }> {
    const user = await this.usersService.findOneByEmailVerificationToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification token.');
    }

    if (user.isEmailVerified) {
      return {
        message: 'Email already verified.',
        user: { id: user.id, email: user.email, role: user.role },
      };
    }

    const updatedUser = await this.usersService.setEmailVerified(user.id);
    return {
      message: 'Email successfully verified.',
      user: { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role },
    };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    this.logger.log(`Resend verification email requested for: ${email}`);
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new NotFoundException('User with this email not found.');
    }

    if (user.isEmailVerified) {
      return { message: 'This email address is already verified.' };
    }

    const newEmailVerificationToken = crypto.randomBytes(32).toString('hex');
    try {
      const updatedUser = await this.usersService.updateEmailVerificationToken(
        user.id,
        newEmailVerificationToken,
      );
      await this.emailService.sendVerificationEmail(
        updatedUser.email,
        updatedUser.name || updatedUser.email,
        newEmailVerificationToken,
      );
      return { message: 'Verification email sent. Please check your inbox.' };
    } catch (error) {
      this.logger.error(
        `Failed to resend verification email to ${user.email}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'Failed to resend verification email. Please try again later.',
      );
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    this.logger.log(`Forgot password requested for: ${email}`);
    const user = await this.usersService.findOneByEmail(email);

    // Important: Do not reveal if the user exists or not to prevent email enumeration.
    // Send a generic success message regardless.
    if (user) {
      try {
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // Token expires in 1 hour

        await this.usersService.createPasswordResetToken(user.id, token, expires);
        
        this.logger.log(`VERY DISTINCT LOG: About to call sendPasswordResetEmail for ${user.email} with token ${token}`);

        await this.emailService.sendPasswordResetEmail(
          user.email,
          user.name || user.email,
          token,
        );
      } catch (error) {
        // Log the error but still return a generic message to the client
        this.logger.error(
          `Failed to process forgot password for ${email}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    } else {
      // Log that a non-existent user was requested, for monitoring, but don't tell the client.
      this.logger.log(`Forgot password request for non-existent email: ${email}`);
    }
    
    // Always return a generic message
    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    this.logger.log(`Reset password attempt with token: ${token?.substring(0, 10)}...`); // Log only part of token

    if (!newPassword) {
      throw new BadRequestException('New password is required.');
    }
    if (newPassword.length < 8) { // Example: Enforce minimum password length
      throw new BadRequestException('Password must be at least 8 characters long.');
    }

    const user = await this.usersService.findUserByPasswordResetToken(token);

    if (!user) {
      this.logger.warn(`Invalid or expired password reset token used: ${token?.substring(0, 10)}...`);
      throw new UnauthorizedException('Invalid or expired password reset token.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.id, hashedPassword);

    // Invalidate all reset tokens for this user after successful password change
    await this.usersService.clearPasswordResetTokensForUser(user.id);

    this.logger.log(`Password reset successfully for user ID: ${user.id}`);
    return { message: 'Password has been reset successfully.' };
  }
} 