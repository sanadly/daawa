import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Import ConfigModule to use ConfigService
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'], // Path to your entities
        synchronize: configService.get<string>('NODE_ENV') !== 'production', // Auto-create schema (dev only)
        logging: configService.get<string>('NODE_ENV') !== 'production', // Enable logging (dev only)
      }),
      inject: [ConfigService], // Inject ConfigService
    }),
  ],
  exports: [TypeOrmModule], // Export TypeOrmModule if other modules need to inject repositories
})
export class DatabaseModule {} 