import { api } from './api';
import { User } from '@/types/auth';

/**
 * Fetch the current user's profile
 */
export const fetchUserProfile = async (): Promise<User> => {
  const response = await api.get('/users/profile');
  return response.data;
};

/**
 * Update the user's profile
 */
export const updateProfile = async (profileData: {
  name?: string;
  email?: string;
  language?: string;
  currentPassword?: string;
  newPassword?: string;
}): Promise<User> => {
  const response = await api.put('/users/profile', profileData);
  return response.data;
}; 