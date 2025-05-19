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
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from './decorators/public.decorator';
import { Logger } from '@nestjs/common';

interface AuthenticatedRequest extends Express.Request {
  user: JwtPayload;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @Public()
  async login(@Request() req: any, @Body() loginDto: LoginUserDto) {
    this.logger.debug('Login endpoint called with credentials:');
    this.logger.debug(`Email: ${loginDto.email}`);
    this.logger.debug(`Password provided: ${loginDto.password ? '******' + loginDto.password.slice(-3) : 'EMPTY'}`);
    
    console.log('LOGIN ATTEMPT', {
      body: loginDto,
      user: req.user ? {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        hasUser: !!req.user
      } : 'NO USER IN REQUEST',
    });
    
    if (!req.user) {
      this.logger.error('No user found in request after LocalAuthGuard');
      throw new UnauthorizedException('Authentication failed - user not found in request');
    }
    
    try {
      this.logger.debug(`Generating login response for user: ${req.user.email}`);
      const result = await this.authService.login(req.user);
      this.logger.debug('Login successful, returning tokens');
      return result;
    } catch (error) {
      this.logger.error(
        `Login error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined
      );
      throw new UnauthorizedException('Authentication failed - could not generate tokens');
    }
  }

  @Post('login-direct')
  @Public()
  @HttpCode(HttpStatus.OK)
  async loginDirect(@Body() loginDto: LoginUserDto) {
    this.logger.debug('Direct login endpoint called with credentials:');
    this.logger.debug(`Email: ${loginDto.email}`);
    this.logger.debug(`Password provided: ${loginDto.password ? '******' + loginDto.password.slice(-3) : 'EMPTY'}`);
    
    console.log('DIRECT LOGIN ATTEMPT', {
      body: {
        email: loginDto.email,
        passwordProvided: !!loginDto.password
      }
    });
    
    try {
      // First validate the user credentials
      const user = await this.authService.validateUser(loginDto.email, loginDto.password);
      
      if (!user) {
        this.logger.warn(`Direct login failed - invalid credentials for email: ${loginDto.email}`);
        throw new UnauthorizedException('Invalid credentials');
      }
      
      // If user is valid, generate tokens
      this.logger.debug(`User validated, generating login response for: ${user.email}`);
      const result = await this.authService.login(user);
      
      console.log('DIRECT LOGIN SUCCESS for user:', user.email);
      this.logger.debug('Direct login successful, returning tokens');
      return result;
    } catch (error) {
      console.error('DIRECT LOGIN ERROR:', error instanceof Error ? error.message : String(error));
      this.logger.error(
        `Direct login error: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined
      );
      throw new UnauthorizedException('Authentication failed');
    }
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