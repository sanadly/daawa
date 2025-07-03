import { Controller, Post, Body, Get, HttpStatus } from '@nestjs/common';
import { PasswordService } from './auth/services/password.service';
import { Public } from './auth/decorators/public.decorator';

@Controller('test-auth')
export class TestAuthController {
  constructor(private readonly passwordService: PasswordService) {}

  @Public()
  @Get('health')
  async healthCheck() {
    return {
      statusCode: HttpStatus.OK,
      message: 'Test auth controller is working',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Post('test-password')
  async testPassword(@Body() body: { password: string }) {
    const validation = this.passwordService.validatePasswordStrength(body.password);
    const hashedPassword = await this.passwordService.hashPassword(body.password);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Password test completed',
      data: {
        validation,
        hashedLength: hashedPassword.length,
        hashStartsWith: hashedPassword.substring(0, 10) + '...',
      },
    };
  }

  @Public()
  @Post('test-compare')
  async testCompare(@Body() body: { password: string; hash: string }) {
    const isMatch = await this.passwordService.comparePassword(body.password, body.hash);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Password comparison completed',
      data: { isMatch },
    };
  }
} 