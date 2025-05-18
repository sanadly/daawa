import { Injectable } from '@nestjs/common';
import { Role } from '../../src/common/decorators/roles.decorator';

@Injectable()
export class MockJwtService {
  sign(payload: any): string {
    // Return a fake token with the payload encoded as a string
    return `fake-jwt-token.${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
  }

  verify(token: string): any {
    // Extract the payload from the token
    try {
      const parts = token.split('.');
      if (parts.length !== 2) {
        throw new Error('Invalid token format');
      }
      const encodedPayload = parts[1];
      const decodedPayload = Buffer.from(encodedPayload, 'base64').toString();
      return JSON.parse(decodedPayload);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
} 