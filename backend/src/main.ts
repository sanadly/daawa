import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

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

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
