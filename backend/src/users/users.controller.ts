import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

// Define the authenticated request type
interface RequestWithUser extends Express.Request {
  user: { sub: number; email: string; role: string };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: RequestWithUser) {
    const user = await this.usersService.findOneById(req.user.sub);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Return user data without sensitive information
    const { password, hashedRefreshToken, emailVerificationToken, ...profileData } = user;
    return profileData;
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const userId = req.user.sub;
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // If email is being changed, check if it's already taken
    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.usersService.findOneByEmail(updateProfileDto.email);
      if (existingUser) {
        throw new ConflictException('Email is already taken');
      }
    }

    // If password is being changed, verify current password
    if (updateProfileDto.newPassword) {
      if (!updateProfileDto.currentPassword) {
        throw new BadRequestException('Current password is required to set a new password');
      }

      const isPasswordValid = await bcrypt.compare(
        updateProfileDto.currentPassword,
        user.password,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(updateProfileDto.newPassword, 10);
      
      // Update user with new password and other profile data
      const updatedUser = await this.usersService.updateProfile(userId, {
        ...updateProfileDto,
        password: hashedPassword,
      });

      const { password, hashedRefreshToken, emailVerificationToken, ...profileData } = updatedUser;
      return profileData;
    }

    // Update profile without changing password
    const { newPassword, currentPassword, ...profileData } = updateProfileDto;
    const updatedUser = await this.usersService.updateProfile(userId, profileData);
    
    // Return updated user data without sensitive information
    const { password, hashedRefreshToken, emailVerificationToken, ...updatedProfileData } = updatedUser;
    return updatedProfileData;
  }
} 