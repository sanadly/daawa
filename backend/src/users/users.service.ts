import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, PasswordResetToken } from '../../generated/prisma'; // Corrected import
import * as bcrypt from 'bcrypt';

// Define the input type for creating a user, reflecting Prisma schema
// These are the fields provided by AuthService during registration.
export interface CreateUserInput {
  email: string;
  password: string; // This will be the hashed password
  name?: string | null;
  emailVerificationToken?: string | null;
  isEmailVerified: boolean;
  // hashedRefreshToken is intentionally omitted as it's not set at registration
  // role and language will use defaults from Prisma schema unless explicitly passed
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // findOneByUsername is removed as username is now 'name' and optional in Prisma schema
  // If needed, a findByName method could be added, but email is primary unique identifier

  async findOneByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findOneById(id: number): Promise<User | null> { // Added for completeness
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserInput): Promise<User> {
    // Password should already be hashed by AuthService before this point
    // Role and language have defaults in Prisma schema
    return this.prisma.user.create({
      data: {
        ...data, // email, password (hashed), name?
        // role: data.role || Role.USER, // Role can be set explicitly or rely on default
        // language: data.language || 'en', // Language can be set or rely on default
      },
    });
  }

  async setCurrentRefreshToken(
    refreshToken: string | null,
    userId: number,
  ): Promise<void> {
    let hashedRefreshToken: string | null = null;
    if (refreshToken) {
      hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }

  async getUserIfRefreshTokenMatches(
    refreshToken: string,
    userId: number,
  ): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.hashedRefreshToken) {
      return null;
    }
    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );
    return isRefreshTokenMatching ? user : null;
  }

  async findOneByEmailVerificationToken(token: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });
  }

  async setEmailVerified(userId: number): Promise<User> { // Return updated user
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null, // Clear the token once verified
      },
    });
  }

  async updateEmailVerificationToken(
    userId: number,
    newToken: string,
  ): Promise<User> { // Return updated user
    return this.prisma.user.update({
      where: { id: userId },
      data: { emailVerificationToken: newToken, isEmailVerified: false }, // Reset verification status if token changes
    });
  }

  async updatePassword(userId: number, newPasswordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: newPasswordHash },
    });
  }

  // Methods for Password Reset based on the separate PasswordResetToken model

  async createPasswordResetToken(
    userId: number,
    token: string,
    expires: Date,
  ): Promise<PasswordResetToken> {
    await this.prisma.passwordResetToken.deleteMany({ where: { userId } }); // Invalidate old tokens
    return this.prisma.passwordResetToken.create({
      data: { userId, token, expires },
    });
  }

  async findUserByPasswordResetToken(tokenValue: string): Promise<User | null> {
    const resetTokenRecord = await this.prisma.passwordResetToken.findUnique({
      where: { token: tokenValue },
      include: { user: true },
    });

    if (!resetTokenRecord || !resetTokenRecord.user) return null;

    if (new Date() > resetTokenRecord.expires) {
      await this.prisma.passwordResetToken.delete({ where: { id: resetTokenRecord.id } });
      return null; // Token expired
    }
    return resetTokenRecord.user;
  }

  // Method to clear all password reset tokens for a user, e.g., after successful password change
  // or when a new token is created (as done in createPasswordResetToken).
  // This specific method might be redundant if createPasswordResetToken already clears old ones,
  // but can be useful for explicit clearing after password update.
  async clearPasswordResetTokensForUser(userId: number): Promise<void> {
    await this.prisma.passwordResetToken.deleteMany({ where: { userId } });
  }
}
 