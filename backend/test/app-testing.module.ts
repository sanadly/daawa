import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { MockPrismaService } from './mocks/prisma.mock';
import { MockJwtAuthGuard } from './mocks/jwt-auth.guard.mock';
import { MockJwtStrategy } from './mocks/jwt-strategy.mock';
import { APP_GUARD } from '@nestjs/core';
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
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'PrismaService',
      useClass: MockPrismaService,
    },
    MockJwtStrategy,
    {
      provide: APP_GUARD,
      useClass: MockJwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppTestingModule {} 