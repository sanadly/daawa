import {
  Controller,
  Post,
  Get,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './services/users.service';
import { StorageFile } from '../storage/interfaces/storage.interface';
import { UpdateProfileDto } from './dtos/update-profile.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.id);
    return {
      success: true,
      data: user,
      message: 'Profile retrieved successfully',
    };
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.usersService.updateProfile(req.user.id, updateProfileDto);
    return {
      success: true,
      data: updatedUser,
      message: 'Profile updated successfully',
    };
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Avatar uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or upload parameters' })
  async uploadAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('File must be an image');
    }

    // Check file size (5MB limit for avatars)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size must be less than 5MB');
    }

    const storageFile: StorageFile = {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    };

    const result = await this.usersService.uploadAvatar(req.user.id, storageFile);

    return {
      success: true,
      data: result,
      message: 'Avatar uploaded successfully',
    };
  }

  @Get('avatar')
  @ApiOperation({ summary: 'Get user avatar URL' })
  @ApiResponse({ status: 200, description: 'Avatar URL retrieved successfully' })
  async getAvatar(
    @Request() req, 
    @Query('presigned') presigned?: string,
    @Query('version') version?: string,
  ) {
    let avatarUrl: string | null;

    if (presigned === 'true') {
      avatarUrl = await this.usersService.getAvatarPresignedUrl(req.user.id);
    } else {
      avatarUrl = await this.usersService.getAvatarUrl(req.user.id, version);
    }

    return {
      success: true,
      data: {
        avatarUrl,
        hasAvatar: !!avatarUrl,
      },
      message: 'Avatar URL retrieved successfully',
    };
  }

  @Get('avatar/responsive')
  @ApiOperation({ summary: 'Get responsive avatar URLs for different formats and sizes' })
  @ApiResponse({ status: 200, description: 'Responsive avatar URLs retrieved successfully' })
  async getAvatarResponsive(@Request() req) {
    const responsiveUrls = await this.usersService.getAvatarResponsiveUrls(req.user.id);

    return {
      success: true,
      data: {
        responsiveUrls,
        hasAvatar: !!responsiveUrls,
      },
      message: 'Responsive avatar URLs retrieved successfully',
    };
  }

  @Get('avatar/:userId')
  @ApiOperation({ summary: 'Get another user avatar URL (public)' })
  @ApiResponse({ status: 200, description: 'Avatar URL retrieved successfully' })
  async getUserAvatar(
    @Param('userId') userId: string,
    @Query('presigned') presigned?: string,
    @Query('version') version?: string,
  ) {
    let avatarUrl: string | null;

    if (presigned === 'true') {
      avatarUrl = await this.usersService.getAvatarPresignedUrl(userId);
    } else {
      avatarUrl = await this.usersService.getAvatarUrl(userId, version);
    }

    return {
      success: true,
      data: {
        avatarUrl,
        hasAvatar: !!avatarUrl,
        userId,
      },
      message: 'Avatar URL retrieved successfully',
    };
  }

  @Get('avatar/:userId/responsive')
  @ApiOperation({ summary: 'Get responsive avatar URLs for another user (public)' })
  @ApiResponse({ status: 200, description: 'Responsive avatar URLs retrieved successfully' })
  async getUserAvatarResponsive(@Param('userId') userId: string) {
    const responsiveUrls = await this.usersService.getAvatarResponsiveUrls(userId);

    return {
      success: true,
      data: {
        responsiveUrls,
        hasAvatar: !!responsiveUrls,
        userId,
      },
      message: 'Responsive avatar URLs retrieved successfully',
    };
  }

  @Delete('avatar')
  @ApiOperation({ summary: 'Delete user avatar' })
  @ApiResponse({ status: 200, description: 'Avatar deleted successfully' })
  @HttpCode(HttpStatus.OK)
  async deleteAvatar(@Request() req) {
    await this.usersService.deleteAvatar(req.user.id);

    return {
      success: true,
      data: {
        userId: req.user.id,
      },
      message: 'Avatar deleted successfully',
    };
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: { currentPassword: string; newPassword: string },
  ) {
    await this.usersService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    return {
      success: true,
      data: {
        userId: req.user.id,
      },
      message: 'Password changed successfully',
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics (admin only)' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  async getUserStats(@Request() req) {
    // Note: Add role-based guard for admin access in production
    const stats = await this.usersService.getUserStats();

    return {
      success: true,
      data: stats,
      message: 'User statistics retrieved successfully',
    };
  }

  @Get('avatar/secure')
  @ApiOperation({ summary: 'Get secure avatar URL with token-based access' })
  @ApiResponse({ status: 200, description: 'Secure avatar URL generated successfully' })
  async getAvatarSecure(
    @Request() req,
    @Query('expiresIn') expiresIn?: number,
    @Query('maxDownloads') maxDownloads?: number,
  ) {
    const secureUrl = await this.usersService.getAvatarSecureUrl(
      req.user.id,
      req.user.id,
      expiresIn,
      maxDownloads,
    );

    return {
      success: true,
      data: {
        secureUrl,
        hasAvatar: !!secureUrl,
      },
      message: 'Secure avatar URL generated successfully',
    };
  }

  @Get('avatar/secure/responsive')
  @ApiOperation({ summary: 'Get secure responsive avatar URLs' })
  @ApiResponse({ status: 200, description: 'Secure responsive avatar URLs generated successfully' })
  async getAvatarSecureResponsive(
    @Request() req,
    @Query('expiresIn') expiresIn?: number,
    @Query('maxDownloads') maxDownloads?: number,
  ) {
    const secureUrls = await this.usersService.getAvatarSecureResponsiveUrls(
      req.user.id,
      req.user.id,
      expiresIn,
      maxDownloads,
    );

    return {
      success: true,
      data: {
        secureUrls,
        hasAvatar: !!secureUrls,
      },
      message: 'Secure responsive avatar URLs generated successfully',
    };
  }

  @Get('avatar/:userId/secure')
  @ApiOperation({ summary: 'Get secure avatar URL for another user' })
  @ApiResponse({ status: 200, description: 'Secure avatar URL generated successfully' })
  async getUserAvatarSecure(
    @Request() req,
    @Param('userId') userId: string,
    @Query('expiresIn') expiresIn?: number,
    @Query('maxDownloads') maxDownloads?: number,
  ) {
    const secureUrl = await this.usersService.getAvatarSecureUrl(
      userId,
      req.user.id,
      expiresIn,
      maxDownloads,
    );

    return {
      success: true,
      data: {
        secureUrl,
        hasAvatar: !!secureUrl,
        userId,
      },
      message: 'Secure avatar URL generated successfully',
    };
  }

  @Get('avatar/:userId/secure/responsive')
  @ApiOperation({ summary: 'Get secure responsive avatar URLs for another user' })
  @ApiResponse({ status: 200, description: 'Secure responsive avatar URLs generated successfully' })
  async getUserAvatarSecureResponsive(
    @Request() req,
    @Param('userId') userId: string,
    @Query('expiresIn') expiresIn?: number,
    @Query('maxDownloads') maxDownloads?: number,
  ) {
    const secureUrls = await this.usersService.getAvatarSecureResponsiveUrls(
      userId,
      req.user.id,
      expiresIn,
      maxDownloads,
    );

    return {
      success: true,
      data: {
        secureUrls,
        hasAvatar: !!secureUrls,
        userId,
      },
      message: 'Secure responsive avatar URLs generated successfully',
    };
  }
} 