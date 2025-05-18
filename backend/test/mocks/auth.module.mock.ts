import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MockJwtStrategy } from './jwt-strategy.mock';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: 'test-secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [MockJwtStrategy],
  exports: [JwtModule],
})
export class MockAuthModule {} 