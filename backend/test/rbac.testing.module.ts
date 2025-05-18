import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MockPrismaService } from './mocks/prisma.mock';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { PermissionsService } from '../src/common/services/permissions.service';
import { RbacTestController } from '../src/common/controllers/rbac-test.controller';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [RbacTestController],
  providers: [
    {
      provide: 'PrismaService',
      useClass: MockPrismaService,
    },
    PermissionsService,
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
  exports: [
    JwtModule,
    'PrismaService',
    PermissionsService,
  ],
})
export class RbacTestingModule {} 