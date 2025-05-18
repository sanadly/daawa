# Role-Based Access Control (RBAC) Implementation

This document describes the Role-Based Access Control system implemented in the Daawa application.

## Overview

The RBAC system provides a comprehensive solution for:

1. Managing user roles and permissions
2. Restricting access to routes based on user roles and permissions
3. Conditionally rendering UI elements based on user permissions
4. Providing API endpoints for role management

## Backend Implementation

The backend RBAC system is implemented in the following files:

- `permissions.service.ts`: Defines the permission handling logic
- `role-management.controller.ts`: Provides API endpoints for managing roles
- `rbac.module.ts`: Configures the RBAC module

### API Endpoints

The following API endpoints are available for role management:

- `GET /role-management/roles` - List all available roles
- `GET /role-management/permissions` - List all available permissions
- `GET /role-management/roles/:role/permissions` - Get permissions for a specific role
- `GET /role-management/permission-groups` - Get permission groups
- `GET /role-management/users` - List users with their roles
- `PUT /role-management/users/:userId/role` - Update a user's role
- `GET /role-management/my-permissions` - Get current user's permissions

## Frontend Implementation

The frontend RBAC system consists of the following components:

### Core Types and Services

- `types/auth.ts`: Defines Role and Permission enums and authentication types
- `services/apiRoleManagement.ts`: API service for role management
- `contexts/AuthContext.tsx`: Authentication context with permission checking

### Permission Components

- `components/auth/ProtectedRoute.tsx`: Route protection component
- `components/auth/PermissionGate.tsx`: Conditional UI rendering component

### Role Management UI

- `components/RoleManagement/UserRoleManagement.tsx`: User role management component
- `components/RoleManagement/RolePermissions.tsx`: Role permissions display component
- `app/admin/role-management/page.tsx`: Role management page

## Usage

### Protecting Routes

Use the `ProtectedRoute` component to restrict access to pages:

```tsx
// In a page component
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Permission } from '@/types/auth';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredPermission={Permission.MANAGE_USERS} fallbackUrl="/dashboard">
      <div>Admin content here</div>
    </ProtectedRoute>
  );
}
```

### Conditional UI Rendering

Use the `PermissionGate` component to conditionally render UI elements:

```tsx
import PermissionGate from '@/components/auth/PermissionGate';
import { Permission } from '@/types/auth';

function SomeComponent() {
  return (
    <div>
      <h1>Always visible content</h1>
      
      <PermissionGate requiredPermission={Permission.MANAGE_CONTENT}>
        <button>Edit Content</button>
      </PermissionGate>
    </div>
  );
}
```

### Checking Permissions in Components

Use the `useAuth` hook to check permissions in components:

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { Permission } from '@/types/auth';

function SomeComponent() {
  const { hasPermission } = useAuth();
  
  const canManageUsers = hasPermission(Permission.MANAGE_USERS);
  
  return (
    <div>
      {canManageUsers && <p>You can manage users.</p>}
    </div>
  );
}
```

## Role Management

The role management page is accessible at `/admin/role-management` and is restricted to users with the `MANAGE_ROLES` permission.

It allows administrators to:

1. View all users and their current roles
2. Update user roles
3. View permissions for each role 