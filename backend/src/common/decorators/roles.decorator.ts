import { SetMetadata } from '@nestjs/common';

export enum Role {
  USER = 'USER',
  STAFF = 'STAFF',
  ORGANIZER = 'ORGANIZER',
  ADMIN = 'ADMIN',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles); 