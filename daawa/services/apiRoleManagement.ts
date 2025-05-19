import { fetchApi } from './apiAuth';
import { Role, User } from '../types/auth';

export interface UserRole {
  userId: number;
  username: string;
  email: string;
  role: Role;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface PermissionGroup {
  name: string;
  permissions: Permission[];
}

/**
 * Fetches all available roles
 */
export const getAllRoles = async (): Promise<Role[]> => {
  return fetchApi('/role-management/roles', {
    method: 'GET',
  });
};

/**
 * Fetches all available permissions
 */
export const getAllPermissions = async (): Promise<Permission[]> => {
  return fetchApi('/role-management/permissions', {
    method: 'GET',
  });
};

/**
 * Fetches permissions for a specific role
 */
export const getPermissionsForRole = async (role: Role): Promise<Permission[]> => {
  return fetchApi(`/role-management/roles/${role}/permissions`, {
    method: 'GET',
  });
};

/**
 * Fetches all permission groups
 */
export const getPermissionGroups = async (): Promise<PermissionGroup[]> => {
  return fetchApi('/role-management/permission-groups', {
    method: 'GET',
  });
};

/**
 * Fetches all users with their roles
 */
export const getUsersWithRoles = async (): Promise<UserRole[]> => {
  return fetchApi('/role-management/users', {
    method: 'GET',
  });
};

/**
 * Updates a user's role
 */
export const updateUserRole = async (userId: number, role: Role): Promise<UserRole> => {
  return fetchApi(`/role-management/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
};

/**
 * Fetches the current user's profile information.
 * The backend's /auth/profile endpoint returns a JWT-like payload.
 * We adapt this to the frontend's User type.
 */
export const getMyProfile = async (): Promise<User> => {
  console.log('[apiRoleManagement.ts] getMyProfile called. Intending to fetch /auth/profile.');
  
  // Define the expected raw response structure from /auth/profile
  interface AuthProfileResponse {
    sub: number;      // userId
    email: string;
    role: Role;
    username?: string; // username might be in the token/payload
    name?: string;     // name might be in the token/payload
  }

  const rawProfile = (await fetchApi('/auth/profile', {
    method: 'GET',
  })) as AuthProfileResponse; // Call fetchApi without generic, then cast

  // Adapt the raw profile to the frontend User type
  return {
    id: rawProfile.sub, // Map sub to id
    email: rawProfile.email,
    role: rawProfile.role,
    // Use username from payload if available, otherwise try name, fallback to email part
    username: rawProfile.username || rawProfile.name || rawProfile.email.split('@')[0],
  };
}; 