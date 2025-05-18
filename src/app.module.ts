import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { EmailModule } from './email/email.module';
import * as path from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { RbacModule } from './rbac/rbac.module';
import { AdminModule } from './admin/admin.module';
import { OrganizerModule } from './organizer/organizer.module';
import { StaffModule } from './staff/staff.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { AdminController } from './admin/admin.controller';
import { OrganizerController } from './organizer/organizer.controller';
import { StaffController } from './staff/staff.controller';
import { PermissionsService } from './common/services/permissions.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(__dirname, '../../../.env'),
    }),
    AuthModule,
    UsersModule,
    EmailModule,
    PrismaModule,
    RbacModule,
    AdminModule,
    OrganizerModule,
    StaffModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
  ],
  controllers: [
    AppController,
    AdminController,
    OrganizerController,
    StaffController,
  ],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Note: We don't register JwtAuthGuard globally because some routes are public
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
    // {
    //   provide: APP_GUARD,
    //   useClass: RolesGuard,
    // },
    // {
    //   provide: APP_GUARD,
    //   useClass: PermissionsGuard,
    // },
    PermissionsService,
  ],
})
export class AppModule {} 