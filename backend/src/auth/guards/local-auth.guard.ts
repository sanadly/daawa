import { Injectable, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  private readonly logger = new Logger(LocalAuthGuard.name);

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    this.logger.debug('LocalAuthGuard canActivate called');
    
    const request = context.switchToHttp().getRequest();
    this.logger.debug(`Login attempt with email: ${request.body?.email || 'unknown'}`);
    
    try {
      const result = super.canActivate(context);
      this.logger.debug(`super.canActivate result: ${result}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Authentication error in LocalAuthGuard: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined
      );
      throw error;
    }
  }
} 