/**
 * User Management API Service
 * Provides methods for interacting with the user management endpoints
 */

import { api } from './api';
import { User, Role } from '@/types/auth';

// Interface defining user data for creation
export interface UserCreateData {
  username: string;
  email: string;
  password: string;
  role: Role;
}

// Interface defining user data for updates
export interface UserUpdateData {
  username?: string;
  email?: string;
  password?: string;
  role?: Role;
}

/**
 * Fetch all users
 * @returns Promise resolving to array of users
 */
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/admin/users');
  return response.data;
};

/**
 * Fetch a specific user by ID
 * @param userId - The ID of the user to fetch
 * @returns Promise resolving to user data
 */
export const getUserById = async (userId: number): Promise<User> => {
  const response = await api.get(`/admin/users/${userId}`);
  return response.data;
};

/**
 * Create a new user
 * @param userData - Data for the new user
 * @returns Promise resolving to the created user
 */
export const createUser = async (userData: UserCreateData): Promise<User> => {
  const response = await api.post('/admin/users', userData);
  return response.data;
};

/**
 * Update an existing user
 * @param userId - The ID of the user to update
 * @param userData - New data for the user
 * @returns Promise resolving to the updated user
 */
export const updateUser = async (userId: number, userData: UserUpdateData): Promise<User> => {
  const response = await api.put(`/admin/users/${userId}`, userData);
  return response.data;
};

/**
 * Delete a user
 * @param userId - The ID of the user to delete
 * @returns Promise resolving to a success message
 */
export const deleteUser = async (userId: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

/**
 * Update a user's role
 * @param userId - The ID of the user to update
 * @param role - The new role for the user
 * @returns Promise resolving to the updated user
 */
export const updateUserRole = async (userId: number, role: Role): Promise<User> => {
  const response = await api.patch(`/admin/users/${userId}/role`, { role });
  return response.data;
};

/**
 * Reset a user's password (admin action)
 * @param userId - The ID of the user
 * @param newPassword - New password for the user
 * @returns Promise resolving to a success message
 */
export const resetUserPassword = async (
  userId: number, 
  newPassword: string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/admin/users/${userId}/reset-password`, { 
    password: newPassword 
  });
  return response.data;
}; 