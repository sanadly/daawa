import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';
import { PrismaService } from './prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email/email.service';

(async () => {
  console.log('Setting up test environment...');
  
  const prisma = new PrismaService();
  const usersService = new UsersService(prisma);
  const jwtService = new JwtService({});
  const configService = new ConfigService();
  const emailService = {} as EmailService;

  const authService = new AuthService(
    usersService,
    jwtService,
    configService,
    emailService,
    prisma
  );

  try {
    console.log('Testing validateUser with test credentials...');
    const validatedUser = await authService.validateUser(
      'user@example.com',
      'password123'
    );
    console.log('Validation result:', validatedUser);
    
    if (validatedUser) {
      console.log('User validation successful!');
      
      try {
        console.log('Attempting login...');
        const loginResult = await authService.login(validatedUser);
        console.log('Login successful!', loginResult);
      } catch (loginError) {
        console.error('Login error:', loginError);
      }
    } else {
      console.log('User validation failed!');
    }
  } catch (error) {
    console.error('Error during validateUser test:', error);
  }

  await prisma.$disconnect();
})(); 