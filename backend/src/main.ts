import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
// import { PrismaClient, Role } from '@prisma/client'; // Commented out as createTestUsers is handled by AuthService
// import * as bcrypt from 'bcrypt'; // Commented out as createTestUsers is handled by AuthService
import * as fs from 'fs';
import * as path from 'path';
import { Request, Response } from 'express';
import { AuthService } from './auth/auth.service';

// Define a port range for the application -- Commented out as unused
// const PORT_RANGE = {
//   min: 3000,
//   max: 3010,
// };

// Setup constants
const PORT_DEFAULT = 3006;

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting application bootstrap process');
  
  try {
    logger.log('Creating NestJS application...');
    const app = await NestFactory.create(AppModule);
    logger.log('NestJS application created successfully');
    
    // Debug registered routes
    logger.log('Debugging registered routes...');
    const server = app.getHttpServer();
    const router = server._events?.request?._router; // Optional chaining for safety

    if (router && router.stack) { // Check if router and stack exist
      const availableRoutes = router.stack
        .filter((layer: any) => layer && layer.route) // Explicitly type layer as any and check layer.route
        .map((layer: any) => { // Explicitly type layer as any
          const route = layer.route;
          const pathValue = route.path;
          const methods = route.methods ? Object.keys(route.methods).map((m: string) => m.toUpperCase()).join(',') : 'N/A';
          return { path: pathValue, methods }; // Use pathValue to avoid conflict with 'path' module
        });
      logger.log(`Available routes: ${JSON.stringify(availableRoutes, null, 2)}`);
    } else {
      logger.warn('Could not retrieve router stack to list routes. Router or stack is undefined.');
    }

    // Enable CORS for your frontend origin
    logger.log('Configuring CORS...');
    app.enableCors({
      origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003'], // Added frontend origin
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true, // Important if you're dealing with cookies/sessions
      allowedHeaders: 'Content-Type, Accept, Authorization', // Ensure common headers are allowed
    });
    logger.log('CORS configured successfully');

    // Use global validation pipe
    logger.log('Setting up global validation pipe...');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // Strips away any properties that don't have any decorators
        forbidNonWhitelisted: true, // Instead of stripping, throw an error
        transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
        transformOptions: {
          enableImplicitConversion: true, // Allows for implicit conversion of types based on TS metadata
        },
      }),
    );
    logger.log('Global validation pipe configured successfully');

    // Use cookie parser middleware
    logger.log('Setting up cookie parser middleware...');
    app.use(cookieParser());
    logger.log('Cookie parser middleware configured successfully');

    // Add a health check endpoint
    app.use('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    logger.log('Health check endpoint configured successfully');

    // Create test users if in development environment
    if (process.env.NODE_ENV !== 'production') {
      try {
        logger.log('Creating test users for development environment...');
        // Use the proper type-safe method to get service by token
        const authService = app.get(AuthService);
        await authService.createTestUsers();
        logger.log('Test users created successfully');
      } catch (error) {
        logger.error(
          'Failed to create test users',
          error instanceof Error ? error.stack : String(error)
        );
      }
    }

    // Determine port with fallback strategy
    let port: number;
    
    // First, check for PORT environment variable
    if (process.env.PORT) {
      port = parseInt(process.env.PORT, 10);
      logger.log(`Using PORT from environment: ${port}`);
    } else {
      // Try to find an available port using our script
      try {
        logger.log('Finding available port using port-finder script...');
        // Use dynamic import instead of require
        const { execSync } = await import('child_process');
        const result = execSync('node scripts/port-finder.js check', { 
          encoding: 'utf8',
          cwd: process.cwd()
        });
        
        const match = result.match(/Available port: (\d+)/);
        if (match && match[1]) {
          port = parseInt(match[1], 10);
          logger.log(`Found available port using port-finder: ${port}`);
        } else {
          // Default fallback
          port = PORT_DEFAULT;
          logger.log(`Using default port: ${port}`);
        }
      } catch (err) {
        // If script fails, use default port
        logger.error('Error running port-finder script:', err instanceof Error ? err.message : String(err));
        port = PORT_DEFAULT;
        logger.log(`Using default port due to error: ${port}`);
      }
    }

    // Start the server and save the port info
    try {
      logger.log(`Attempting to start server on port ${port}...`);
      await app.listen(port);
      logger.log(`Application is running on: http://localhost:${port}`);
      
      const portFilePath = path.join(process.cwd(), 'current-port.json');
      fs.writeFileSync(portFilePath, JSON.stringify({ port }));
      logger.log(`Port information saved to ${portFilePath}`);
    } catch (initialError) {
      logger.error(`Failed to start server on initial port ${port}:`, initialError instanceof Error ? initialError.message : String(initialError));
      
      if (initialError instanceof Error && initialError.message.includes('EADDRINUSE')) {
        logger.warn('Initial port in use. Attempting to find an available port in range 3000-3010...');
        let foundPort = false;
        for (let p = 3000; p <= 3010; p++) {
          if (p === port) continue; // Skip the already tried initial port
          try {
            logger.log(`Attempting to listen on port ${p}...`);
            await app.listen(p);
            port = p; // Update the port to the successfully bound one
            logger.log(`Application is running on alternate port: http://localhost:${port}`);
            
            const portFilePath = path.join(process.cwd(), 'current-port.json');
            fs.writeFileSync(portFilePath, JSON.stringify({ port }));
            logger.log(`Port information saved to ${portFilePath}`);
            foundPort = true;
            break; // Exit loop once a port is successfully bound
          } catch (tryError) {
            logger.warn(`Port ${p} is also in use or encountered an error: ${tryError instanceof Error ? tryError.message : String(tryError)}`);
          }
        }
        if (!foundPort) {
          logger.error('Failed to find an available port in the specified range. Exiting.');
          process.exit(1);
        }
      } else {
        // If the error is not EADDRINUSE, exit
        logger.error('An unexpected error occurred while starting the server. Exiting.');
        process.exit(1);
      }
    }
  } catch (bootstrapError) {
    logger.error(
        'Fatal error during bootstrap:', 
        bootstrapError instanceof Error ? bootstrapError.stack : String(bootstrapError)
    );
    process.exit(1);
  }
}

// Function to create test users for development -- Should be commented out or removed if AuthService handles it
// async function createTestUsers() { ... }

bootstrap();
