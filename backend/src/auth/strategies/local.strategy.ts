import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { User } from '@prisma/client';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
    this.logger.debug('LocalStrategy initialized with usernameField: email');
  }

  async validate(
    email: string,
    pass: string,
  ): Promise<Omit<User, 'password'> | null> {
    this.logger.debug(
      `LocalStrategy validate called for email: ${email}, password provided: ${pass ? '******' + pass.slice(-3) : 'EMPTY'}`,
    );
    try {
      const user = await this.authService.validateUser(email, pass);
      if (!user) {
        this.logger.warn(`Invalid credentials for email: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }
      this.logger.debug(`User validated successfully: ${user.email}`);
      return user; // AuthService.validateUser should return user without password
    } catch (error) {
      this.logger.error(
        `Authentication error in LocalStrategy: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined
      );
      // Re-throw the original error or a specific one
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Authentication failed in strategy');
    }
  }
} 