// Types
export * from './types';

// Permissions
export * from './permissions';

// Auth Context and Hook
export { AuthProvider, useAuth } from './auth-context';

// API
export { authApi } from './auth-api';
export { accountApi } from './account-api';

// Components
export { ProtectedRoute } from './components/ProtectedRoute';
export {
  RoleGuard,
  AdminOnly,
  OrganizerOrAdmin,
  StaffOnly,
  CanCreateEvents,
  CanManageUsers,
  CanPerformCheckin,
} from './components/RoleGuard';
export { UnauthorizedFallback } from './components/UnauthorizedFallback';
export { LoadingSpinner } from './components/LoadingSpinner';

// Account Management Components
export { default as ProfileSettings } from './components/ProfileSettings';
export { default as ChangePassword } from './components/ChangePassword';
export { default as ActivityDashboard } from './components/ActivityDashboard'; 