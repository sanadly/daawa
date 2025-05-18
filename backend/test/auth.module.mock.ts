import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './mocks/jwt-strategy.mock';

const JWT_SECRET = 'test-secret-key-for-testing-only';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [JwtStrategy],
  exports: [PassportModule, JwtModule, JwtStrategy],
})
export class MockAuthModule {} 