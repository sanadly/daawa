export enum Role {
  USER = 'USER',
  STAFF = 'STAFF',
  ORGANIZER = 'ORGANIZER',
  ADMIN = 'ADMIN',
}

export enum Permission {
  // Admin permissions
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_ROLES = 'MANAGE_ROLES',
  VIEW_LOGS = 'VIEW_LOGS',
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  
  // Organizer permissions
  MANAGE_EVENTS = 'MANAGE_EVENTS',
  APPROVE_EVENTS = 'APPROVE_EVENTS',
  MANAGE_REGISTRATIONS = 'MANAGE_REGISTRATIONS',
  
  // Staff permissions
  VIEW_REPORTS = 'VIEW_REPORTS',
  MANAGE_CONTENT = 'MANAGE_CONTENT',
  RESPOND_TO_INQUIRIES = 'RESPOND_TO_INQUIRIES',
  
  // Common permissions
  VIEW_PUBLIC_EVENTS = 'VIEW_PUBLIC_EVENTS',
  REGISTER_FOR_EVENTS = 'REGISTER_FOR_EVENTS',
  SUBMIT_INQUIRIES = 'SUBMIT_INQUIRIES',
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
}

// Type for the auth context
export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: Permission[];
  login: (userData: User, tokens: AuthTokens) => void;
  logout: () => void;
  hasPermission: (permission: Permission | Permission[]) => boolean;
  hasRole: (role: Role) => boolean;
} 