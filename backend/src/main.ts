import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for your frontend origin
  app.enableCors({
    origin: 'http://localhost:3000', // The origin of your Next.js frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Important if you're dealing with cookies/sessions
    allowedHeaders: 'Content-Type, Accept, Authorization', // Ensure common headers are allowed
  });

  // Use global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strips away any properties that don't have any decorators
    forbidNonWhitelisted: true, // Instead of stripping, throw an error
    transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
    transformOptions: {
      enableImplicitConversion: true, // Allows for implicit conversion of types based on TS metadata
    },
  }));

  // Use cookie parser middleware
  app.use(cookieParser());

  // Create test users if in development environment
  if (process.env.NODE_ENV !== 'production') {
    await createTestUsers();
  }

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

// Function to create test users for development
async function createTestUsers() {
  try {
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const prisma = new PrismaClient();

    const testUsers = [
      { email: 'user@example.com', name: 'Regular User', role: Role.USER },
      { email: 'admin@example.com', name: 'Admin User', role: Role.ADMIN },
      { email: 'staff@example.com', name: 'Staff Member', role: Role.STAFF },
      { email: 'organizer@example.com', name: 'Event Organizer', role: Role.ORGANIZER }
    ];

    console.log('Creating test users with password: "password123"');

    for (const user of testUsers) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {
          role: user.role,
          password: hashedPassword,
          isEmailVerified: true,
        },
        create: {
          email: user.email,
          password: hashedPassword,
          name: user.name,
          role: user.role,
          isEmailVerified: true,
          language: 'en',
        },
      });
      console.log(`Test user: ${user.email} (${user.role}) created or updated`);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error creating test users:', error);
  }
}

bootstrap();
