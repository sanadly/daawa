export interface LoginCredentials {
  email: string;
  password?: string;
  provider?: 'google' | 'facebook';
  token?: string;
} 