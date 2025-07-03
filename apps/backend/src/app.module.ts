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
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { TestAuthController } from './test-auth.controller';
import { PasswordService } from './auth/services/password.service';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
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
