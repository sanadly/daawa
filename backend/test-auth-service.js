const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { AuthService } = require('./dist/src/auth/auth.service');
const { UsersService } = require('./dist/src/users/users.service');
const { JwtService } = require('@nestjs/jwt');
const { ConfigService } = require('@nestjs/config');
const { EmailService } = require('./dist/src/email/email.service');

async function testAuthService() {
  try {
    console.log('Setting up test environment...');
    
    // Create dependencies
    const prisma = new PrismaClient();
    const usersService = new UsersService(prisma);
    const jwtService = new JwtService({});
    const configService = new ConfigService();
    const emailService = { sendVerificationEmail: jest.fn() };
    
    // Create AuthService instance
    const authService = new AuthService(
      usersService,
      jwtService,
      configService,
      emailService,
      prisma
    );
    
    console.log('Testing validateUser with test credentials...');
    
    // Test validateUser directly
    const validatedUser = await authService.validateUser(
      'user@example.com',
      'password123'
    );
    
    console.log('Validation result:', validatedUser);
    
    if (validatedUser) {
      console.log('User validation successful!');
    } else {
      console.log('User validation failed!');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testAuthService(); 