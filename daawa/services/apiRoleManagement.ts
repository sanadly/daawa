import { fetchApi } from './apiAuth';
import { Role, Permission as PermissionEnum } from '../types/auth';

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
 * Fetches the current user's permissions
 */
export const getMyPermissions = async (): Promise<PermissionEnum[]> => {
  return fetchApi('/role-management/my-permissions', {
    method: 'GET',
  });
}; 