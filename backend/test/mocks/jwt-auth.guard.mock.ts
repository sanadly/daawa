import { Injectable, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class MockJwtAuthGuard {
  private jwtService: JwtService;

  constructor() {
    // Create JWT service with test secret
    this.jwtService = new JwtService({
      secret: 'test-secret-key-for-testing-only',
    });
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Extract the request from the context
    const request = context.switchToHttp().getRequest();
    
    // Check if there's an Authorization header
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      // No Authorization header, deny access
      return false;
    }
    
    // Extract the token and verify it's in the correct format
    const [bearer, token] = authHeader.split(' ');
    
    if (bearer !== 'Bearer' || !token) {
      // Invalid Authorization header format, deny access
      return false;
    }
    
    try {
      // Verify the token using the JWT service
      const payload = this.jwtService.verify(token);
      
      // Attach the user to the request for later use
      request.user = {
        userId: payload.userId,
        username: payload.username,
        roles: payload.roles,
      };
      
      return true;
    } catch (error: any) {
      // Token verification failed, deny access
      console.error('Token verification failed:', error?.message || 'Unknown error');
      return false;
    }
  }
} 