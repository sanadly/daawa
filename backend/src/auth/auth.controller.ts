import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  Headers,
  UnauthorizedException,
  Query,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { ResendVerificationEmailDto } from './dto/resend-verification-email.dto';
import { JwtPayload } from './types/jwt-payload.interface';

interface AuthenticatedRequest extends Express.Request {
  user: JwtPayload;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginUserDto: LoginUserDto) {
    const user = await this.authService.validateUser(
      loginUserDto.email,
      loginUserDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Request() req: AuthenticatedRequest,
    @Headers('authorization') authHeader: string,
  ) {
    const refreshTokenString = authHeader?.split(' ')[1];
    if (!refreshTokenString) {
      throw new UnauthorizedException(
        'Refresh token not found in Authorization header',
      );
    }
    return this.authService.refreshToken(req.user.sub, refreshTokenString);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: AuthenticatedRequest) {
    return this.authService.logout(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: AuthenticatedRequest) {
    return req.user;
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is missing.');
    }
    try {
      return await this.authService.verifyEmail(token);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerificationEmailController(
    @Body() resendVerificationEmailDto: ResendVerificationEmailDto,
  ) {
    return this.authService.resendVerificationEmail(
      resendVerificationEmailDto.email,
    );
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPasswordController(
    @Body() body: { email: string }, // Assuming a simple body with email
  ): Promise<{ message: string }> {
    if (!body || !body.email) {
      throw new BadRequestException('Email is required.');
    }
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPasswordController(
    @Body() body: { token: string; newPassword: string },
  ): Promise<{ message: string }> {
    if (!body || !body.token || !body.newPassword) {
      throw new BadRequestException('Token and new password are required.');
    }
    try {
      return await this.authService.resetPassword(body.token, body.newPassword);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new UnauthorizedException(error.message); // Invalid/expired token
      }
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message); // Password policy violation
      }
      // Log other unexpected errors
      console.error('Unexpected error during password reset:', error);
      throw new InternalServerErrorException('Could not reset password.');
    }
  }
}