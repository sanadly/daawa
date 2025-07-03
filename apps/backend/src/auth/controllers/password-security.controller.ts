import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { RequirePermissions } from '../decorators/permissions.decorator';
import { GetUser } from '../decorators/user.decorator';
import { Permission } from '../constants/permissions';
import { PasswordService, PasswordValidationResult, PasswordSecurityReport } from '../services/password.service';
import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max, MinLength } from 'class-validator';

class ValidatePasswordDto {
  @IsString()
  @MinLength(1)
  password: string;
}

class GeneratePasswordDto {
  @IsOptional()
  @IsNumber()
  @Min(8)
  @Max(128)
  length?: number = 16;

  @IsOptional()
  @IsBoolean()
  includeUppercase?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeLowercase?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeNumbers?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeSymbols?: boolean = true;

  @IsOptional()
  @IsBoolean()
  excludeSimilar?: boolean = false;
}

class CheckPasswordReuseDto {
  @IsString()
  @MinLength(1)
  password: string;

  @IsOptional()
  @IsString()
  userId?: string; // For admin use only
}

@ApiTags('Password Security')
@Controller('auth/password-security')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PasswordSecurityController {
  constructor(private readonly passwordService: PasswordService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Validate password strength',
    description: 'Analyze password strength and security metrics including entropy calculation and estimated crack time.'
  })
  @ApiBody({ type: ValidatePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password validation results',
    schema: {
      example: {
        isValid: true,
        errors: [],
        score: 8,
        strength: 'good',
        entropy: 52.6,
        estimatedCrackTime: '3 years'
      }
    }
  })
  async validatePassword(
    @Body(ValidationPipe) dto: ValidatePasswordDto,
  ): Promise<PasswordValidationResult> {
    return this.passwordService.validatePasswordStrength(dto.password);
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Generate secure password',
    description: 'Generate a cryptographically secure password with customizable options.'
  })
  @ApiBody({ type: GeneratePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Generated secure password',
    schema: {
      example: {
        password: 'K9#mX7!pQ2$vR8@w',
        strength: 'strong',
        entropy: 64.2
      }
    }
  })
  async generatePassword(
    @Body(ValidationPipe) dto: GeneratePasswordDto,
  ): Promise<{ password: string; strength: string; entropy: number }> {
    const password = this.passwordService.generateSecurePassword(dto.length, {
      includeUppercase: dto.includeUppercase,
      includeLowercase: dto.includeLowercase,
      includeNumbers: dto.includeNumbers,
      includeSymbols: dto.includeSymbols,
      excludeSimilar: dto.excludeSimilar,
    });

    const validation = this.passwordService.validatePasswordStrength(password);

    return {
      password,
      strength: validation.strength,
      entropy: validation.entropy,
    };
  }

  @Post('check-reuse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Check password reuse',
    description: 'Check if a password has been used recently by the current user or specified user (admin only).'
  })
  @ApiBody({ type: CheckPasswordReuseDto })
  @ApiResponse({
    status: 200,
    description: 'Password reuse check result',
    schema: {
      example: {
        isReused: false,
        message: 'Password has not been used recently'
      }
    }
  })
  async checkPasswordReuse(
    @Body(ValidationPipe) dto: CheckPasswordReuseDto,
    @GetUser('id') currentUserId: string,
  ): Promise<{ isReused: boolean; message: string }> {
    let targetUserId = currentUserId;

    // If userId is provided, verify admin permissions
    if (dto.userId && dto.userId !== currentUserId) {
      // This would need proper permission checking
      // For now, assume only the user can check their own password history
      targetUserId = currentUserId;
    }

    const isReused = await this.passwordService.isPasswordReused(targetUserId, dto.password);

    return {
      isReused,
      message: isReused 
        ? 'Password has been used recently and cannot be reused'
        : 'Password has not been used recently'
    };
  }

  @Get('security-report')
  @ApiOperation({ 
    summary: 'Get password security report',
    description: 'Get comprehensive password security report for the current user.'
  })
  @ApiResponse({
    status: 200,
    description: 'Password security report',
    schema: {
      example: {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        lastPasswordChange: '2024-01-15T10:30:00Z',
        failedAttempts: 0,
        isLocked: false,
        lockoutExpiry: null,
        passwordAge: 15,
        requiresChange: false,
        securityScore: 95
      }
    }
  })
  async getSecurityReport(
    @GetUser('id') userId: string,
  ): Promise<PasswordSecurityReport> {
    return this.passwordService.getPasswordSecurityReport(userId);
  }

  @Get('security-report/:userId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.USER_READ)
  @ApiOperation({ 
    summary: 'Get user password security report (Admin)',
    description: 'Get comprehensive password security report for any user. Requires USER_READ permission.'
  })
  @ApiParam({ name: 'userId', description: 'User ID to get security report for' })
  @ApiResponse({
    status: 200,
    description: 'Password security report for specified user'
  })
  async getUserSecurityReport(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<PasswordSecurityReport> {
    return this.passwordService.getPasswordSecurityReport(userId);
  }

  @Post('migrate-hash/:userId')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.SYSTEM_CONFIG)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Migrate password hash algorithm (System Admin)',
    description: 'Migrate a user\'s password hash to the current algorithm. Requires SYSTEM_CONFIG permission and the user\'s current password.'
  })
  @ApiParam({ name: 'userId', description: 'User ID to migrate password hash for' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        currentPassword: { type: 'string', description: 'User\'s current password for verification' }
      },
      required: ['currentPassword']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Password hash migration completed',
    schema: {
      example: {
        success: true,
        message: 'Password hash migrated to argon2',
        previousAlgorithm: 'bcrypt',
        newAlgorithm: 'argon2'
      }
    }
  })
  async migratePasswordHash(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: { currentPassword: string },
  ): Promise<{ success: boolean; message: string; previousAlgorithm: string; newAlgorithm: string }> {
    try {
      const previousAlgorithm = 'bcrypt'; // Would detect this from current hash
      await this.passwordService.migratePasswordHash(userId, body.currentPassword);
      
      return {
        success: true,
        message: 'Password hash migrated successfully',
        previousAlgorithm,
        newAlgorithm: 'argon2',
      };
    } catch (error: unknown) {
      const errorMessage = (error as Error).message || 'Failed to migrate password hash';
      return {
        success: false,
        message: errorMessage,
        previousAlgorithm: 'unknown',
        newAlgorithm: 'argon2',
      };
    }
  }

  @Get('config')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.SYSTEM_CONFIG)
  @ApiOperation({ 
    summary: 'Get password security configuration (System Admin)',
    description: 'Get current password security configuration. Requires SYSTEM_CONFIG permission.'
  })
  @ApiResponse({
    status: 200,
    description: 'Password security configuration',
    schema: {
      example: {
        algorithm: 'argon2',
        passwordHistoryCount: 5,
        maxFailedAttempts: 5,
        lockoutDurationMinutes: 30,
        requirePeriodicChange: false,
        passwordExpiryDays: 90,
        minimumStrengthScore: 6
      }
    }
  })
  async getSecurityConfig(): Promise<{
    algorithm: string;
    passwordHistoryCount: number;
    maxFailedAttempts: number;
    lockoutDurationMinutes: number;
    requirePeriodicChange: boolean;
    passwordExpiryDays: number;
    minimumStrengthScore: number;
  }> {
    return {
      algorithm: 'argon2', // Would get from service config
      passwordHistoryCount: 5,
      maxFailedAttempts: 5,
      lockoutDurationMinutes: 30,
      requirePeriodicChange: false,
      passwordExpiryDays: 90,
      minimumStrengthScore: 6,
    };
  }
} 