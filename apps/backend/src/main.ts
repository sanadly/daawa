import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { logger } from './config/logger.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpExceptionFilter } from './middleware/http-exception.filter';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configure Express to handle large headers
  const server = app.getHttpServer();
  (server as any).maxHttpHeaderSize = 16384;

  // Performance monitoring middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > 1000) { // Log slow requests (>1s)
        logger.warn(`Slow request: ${req.method} ${req.url} took ${duration}ms`);
      }
    });
    next();
  });

  // Serve static assets (e.g., template previews)
  app.useStaticAssets(join(__dirname, 'assets'), {
    prefix: '/assets/',
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  // Set global prefix for all routes
  app.setGlobalPrefix('api/v1');
  
  // Swagger setup for API documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Daawa API')
      .setDescription('Event Management System API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.info(`🚀 Daawa API is running on: http://localhost:${port}`);
  logger.info(`📚 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
