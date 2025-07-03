import { Injectable, Logger } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../../database/entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface QrCodePayload {
  eventId: string;
  guestId: string;
  passId: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class JwtService {
  private readonly logger = new Logger(JwtService.name);

  constructor(
    private readonly nestJwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokens(user: User, permissions: string[]) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions,
    };

    const accessToken = this.nestJwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION'),
    });

    const refreshToken = this.nestJwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
    });

    return { accessToken, refreshToken };
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return this.nestJwtService.verify(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
    } catch (error) {
      this.logger.error('Invalid token', error);
      throw new Error('Invalid token');
    }
  }

  async generateQrCodeToken(payload: Omit<QrCodePayload, 'iat' | 'exp'>): Promise<string> {
    return this.nestJwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_QR_CODE_SECRET'),
      expiresIn: this.configService.get<string>('JWT_QR_CODE_EXPIRATION'),
    });
  }

  async verifyQrCodeToken(token: string): Promise<QrCodePayload> {
    try {
      return this.nestJwtService.verify(token, {
        secret: this.configService.get<string>('JWT_QR_CODE_SECRET'),
      });
    } catch (error) {
      this.logger.error('Invalid QR code token', error);
      throw new Error('Invalid QR code token');
    }
  }
} 