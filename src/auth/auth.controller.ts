import { Post, Body, HttpCode, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';

@Post('login')
@HttpCode(HttpStatus.OK)
async login(@Body() loginUserDto: LoginUserDto) {
  console.log('Auth Controller - Login attempt:', {
    email: loginUserDto.email,
    passwordProvided: !!loginUserDto.password,
    passwordLength: loginUserDto.password?.length
  });
  
  try {
    const user = await this.authService.validateUser(
      loginUserDto.email,
      loginUserDto.password,
    );
    
    if (!user) {
      console.log('Auth Controller - Login failed: Invalid credentials');
      throw new UnauthorizedException('Invalid credentials');
    }
    
    console.log('Auth Controller - Login successful for user:', user.email);
    return this.authService.login(user);
  } catch (error) {
    console.error('Auth Controller - Login error:', error.message);
    if (error instanceof UnauthorizedException) {
      throw error; // Re-throw auth-specific errors
    }
    throw new UnauthorizedException('Login failed');
  }
} 