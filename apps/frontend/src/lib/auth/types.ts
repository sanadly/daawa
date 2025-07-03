export enum UserRole {
  ADMIN = 'admin',
  ORGANIZER = 'organizer',
  STAFF = 'staff',
}

export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_ASSIGN_ROLES = 'user:assign_roles',

  // Event Management
  EVENT_CREATE = 'event:create',
  EVENT_READ = 'event:read',
  EVENT_UPDATE = 'event:update',
  EVENT_DELETE = 'event:delete',
  EVENT_PUBLISH = 'event:publish',
  EVENT_ACTIVATE = 'event:activate',
  EVENT_DEACTIVATE = 'event:deactivate',

  // Guest Management
  GUEST_CREATE = 'guest:create',
  GUEST_READ = 'guest:read',
  GUEST_UPDATE = 'guest:update',
  GUEST_DELETE = 'guest:delete',
  GUEST_IMPORT = 'guest:import',
  GUEST_EXPORT = 'guest:export',

  // Check-in Management
  CHECKIN_PERFORM = 'checkin:perform',
  CHECKIN_READ = 'checkin:read',
  CHECKIN_OVERRIDE = 'checkin:override',

  // Analytics & Reporting
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_EXPORT = 'analytics:export',

  // System Administration
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_LOGS = 'system:logs',
  SYSTEM_MONITOR = 'system:monitor',

  // Template Management
  TEMPLATE_CREATE = 'template:create',
  TEMPLATE_READ = 'template:read',
  TEMPLATE_UPDATE = 'template:update',
  TEMPLATE_DELETE = 'template:delete',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  preferred_language: string;
  phone?: string;
  avatar_url?: string;
  email_verified: boolean;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  currentEventId?: string;
}

export interface AuthState {
  user: User | null;
  permissions: Permission[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  preferred_language?: string;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RoleHierarchy {
  role: UserRole;
  level: number;
  description: string;
} 