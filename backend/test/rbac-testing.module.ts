import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MockPrismaService } from './mocks/prisma.mock';
import { RbacTestController } from '../src/common/controllers/rbac-test.controller';
import { PermissionsService } from '../src/common/services/permissions.service';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { MockJwtAuthGuard } from './mocks/jwt-auth.guard.mock';
import { MockJwtStrategy } from './mocks/jwt-strategy.mock';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PassportModule,
    JwtModule.register({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
  ],
  controllers: [RbacTestController],
  providers: [
    {
      provide: 'PrismaService',
      useClass: MockPrismaService,
    },
    PermissionsService,
    RolesGuard,
    PermissionsGuard,
    MockJwtAuthGuard,
    MockJwtStrategy,
  ],
  exports: [JwtModule],
})
export class RbacTestingModule {} 