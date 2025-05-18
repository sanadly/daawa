import { Module } from '@nestjs/common';
import { PermissionsService } from '../services/permissions.service';
import { RoleManagementController } from '../controllers/role-management.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  controllers: [RoleManagementController],
  providers: [
    PermissionsService,
    PrismaService,
    // Register global guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
  exports: [PermissionsService],
})
export class RbacModule {} 