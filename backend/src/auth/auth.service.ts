import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';

type UserData = Pick<User, 'id' | 'username' | 'email'>;

export interface Tokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse extends Tokens {
  user: UserData;
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
    username: string,
    pass: string,
  ): Promise<UserData | null> {
    const user = await this.usersService.findOneByUsername(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      if (!user.isEmailVerified) {
        throw new UnauthorizedException(
          'Please verify your email address before logging in.',
        );
      }
      return { id: user.id, username: user.username, email: user.email };
    }
    return null;
  }

  private async getTokens(
    userId: number,
    username: string,
  ): Promise<Tokens> {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtExpiresIn =
      this.configService.get<string>('JWT_EXPIRES_IN') || '3600s';
    const jwtRefreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET');
    const jwtRefreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    if (!jwtSecret || !jwtRefreshSecret) {
      throw new Error('JWT signing secrets are not configured properly.');
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, username },
        {
          secret: jwtSecret,
          expiresIn: jwtExpiresIn,
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, username },
        {
          secret: jwtRefreshSecret,
          expiresIn: jwtRefreshExpiresIn,
        },
      ),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async login(user: UserData): Promise<LoginResponse> {
    const tokens = await this.getTokens(user.id, user.username);
    await this.usersService.setCurrentRefreshToken(
      tokens.refresh_token,
      user.id,
    );
    return {
      ...tokens,
      user,
    };
  }

  async register(
    createUserDto: Pick<User, 'username' | 'password' | 'email'>,
  ): Promise<UserData | null> {
    const existingUserByUsername = await this.usersService.findOneByUsername(
      createUserDto.username,
    );
    if (existingUserByUsername) {
      throw new ConflictException('Username already exists');
    }

    const existingUserByEmail = await this.usersService.findOneByEmail(
      createUserDto.email,
    );
    if (existingUserByEmail) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const userEntity = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
      emailVerificationToken,
      isEmailVerified: false,
    });

    if (!userEntity) {
      this.logger.error('User creation did not return an entity.');
      throw new Error('User registration failed.');
    }

    try {
      await this.emailService.sendVerificationEmail(
        userEntity.email,
        userEntity.username,
        emailVerificationToken,
      );
      this.logger.log(
        `Verification email process initiated for ${userEntity.username}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${userEntity.email}`,
        error instanceof Error ? error.stack : 'Unknown error stack',
      );
    }

    return {
      id: userEntity.id,
      username: userEntity.username,
      email: userEntity.email,
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
    const tokens = await this.getTokens(user.id, user.username);
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

  async verifyEmail(
    token: string,
  ): Promise<{ message: string; user?: UserData }> {
    const user = await this.usersService.findOneByEmailVerificationToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification token.');
    }

    if (user.isEmailVerified) {
      return {
        message: 'Email already verified.',
        user: { id: user.id, username: user.username, email: user.email },
      };
    }

    await this.usersService.setEmailVerified(user.id);
    return {
      message: 'Email successfully verified.',
      user: { id: user.id, username: user.username, email: user.email },
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
      await this.usersService.updateEmailVerificationToken(
        user.id,
        newEmailVerificationToken,
      );
      await this.emailService.sendVerificationEmail(
        user.email,
        user.username,
        newEmailVerificationToken,
      );
      return { message: 'Verification email sent. Please check your inbox.' };
    } catch (error) {
      this.logger.error(
        `Failed to resend verification email to ${user.email}`,
        error instanceof Error ? error.stack : 'Unknown error during resend',
      );
      throw new InternalServerErrorException(
        'Failed to resend verification email. Please try again later.',
      );
    }
  }
} 