import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { AdminModule } from './admin/admin.module';
import { PassesModule } from './passes/passes.module';
import { GuestsModule } from './guests/guests.module';
import { CheckinModule } from './checkin/checkin.module';
import { EmailModule } from './email/email.module';
import { StorageModule } from './storage/storage.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PasswordService } from './auth/services/password.service';
import { CompanyModule } from './company/company.module';
import storageConfig from './config/storage.config';
import secretsConfig from './config/secrets.config';


@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [storageConfig, secretsConfig],
      envFilePath: ['../../environments/development.env', '.env'],
      expandVariables: true,
    }),

    // Database module
    DatabaseModule,

    // Feature modules
    AuthModule,
    UsersModule,
    EventsModule,
    AdminModule,
    PassesModule,
    GuestsModule,
    CheckinModule,
    EmailModule,
    StorageModule,
    CompanyModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply JWT guard globally (except for routes marked with @Public())
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
