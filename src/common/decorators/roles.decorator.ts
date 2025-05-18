import { SetMetadata } from '@nestjs/common';

// Define the Role enum directly here instead of importing from Prisma
export enum Role {
  USER = 'USER',
  STAFF = 'STAFF',
  ORGANIZER = 'ORGANIZER',
  ADMIN = 'ADMIN',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles); 