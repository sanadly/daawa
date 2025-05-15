import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseService {
  // This service can be expanded later if needed, for example,
  // to include methods for seeding the database or other utility functions.
  constructor() {
    // In a more complex setup, you might inject ConfigService here
    // or other services needed for database operations.
  }
} 