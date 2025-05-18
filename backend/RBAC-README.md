# Enhanced RBAC Implementation with Permission-Based Access Control

This document outlines the enhanced Role-Based Access Control (RBAC) system implemented in our application, which combines traditional role-based security with fine-grained permission-based control.

## Core Components

### 1. Role System

The application defines four primary user roles:

```typescript
export enum Role {
  ADMIN = 'ADMIN',
  ORGANIZER = 'ORGANIZER',
  STAFF = 'STAFF',
  USER = 'USER',
}
```

These roles establish the high-level access tiers within the application.

### 2. Permission System

Beyond roles, we've implemented a granular permission system that defines specific actions users can perform:

```typescript
export enum Permission {
  // User profile permissions
  READ_PROFILE = 'read_profile',
  UPDATE_PROFILE = 'update_profile',
  DELETE_PROFILE = 'delete_profile',

  // Event permissions
  CREATE_EVENT = 'create_event',
  READ_EVENT = 'read_event',
  // ... and many more
}
```

Each permission represents a specific capability or action rather than broad access to a feature.

### 3. Role-Based Guards

The `RolesGuard` enforces role-based access:

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

### 4. Permission-Based Guards

The `PermissionsGuard` provides finer control based on specific permissions:

```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    // ... permission checking logic
  }
}
```

### 5. Centralized Permission Management

The `PermissionsService` manages the mapping between roles and permissions:

```typescript
@Injectable()
export class PermissionsService {
  private readonly rolePermissionsMap: Record<Role, Permission[]> = {
    [Role.USER]: [
      Permission.READ_PROFILE,
      Permission.UPDATE_PROFILE,
      // ...more permissions
    ],
    // ... mappings for other roles
  };

  // Helper methods for permission checks
  // ...
}
```

This centralized approach makes it easy to update role permissions throughout the application.

## Implementation Pattern

### 1. Role-Specific Controllers

Controllers are organized by user role, making permissions clearer:

- `AdminController`: Endpoints accessible to administrators
- `OrganizerController`: Endpoints for event organizers
- `StaffController`: Endpoints for staff members

### 2. Combining Role and Permission Checks

Endpoints use both role and permission decorators:

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN)
export class AdminController {
  @Get('users')
  @Permissions(Permission.MANAGE_USERS)
  getAllUsers() {
    // Implementation
  }
}
```

This approach ensures that:
1. The user must be authenticated (JwtAuthGuard)
2. The user must have the required role (RolesGuard)
3. The user must have the specific permission for the action (PermissionsGuard)

## Usage Examples

### Restricting Access by Role

```typescript
@Controller('organizer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ORGANIZER, Role.ADMIN) // Only organizers and admins
export class OrganizerController {
  // Controller methods
}
```

### Permission-Based Access Control

```typescript
@Get('reports/daily-check-ins')
@Permissions(Permission.VIEW_REPORTS)
getDailyCheckInReport() {
  // Implementation
}
```

### Multiple Required Permissions

```typescript
@Get('events')
@Permissions(Permission.READ_EVENT, Permission.VIEW_ATTENDEES)
getAllEvents() {
  // Implementation
}
```

## Testing

The system includes comprehensive tests:

1. Unit tests for `RolesGuard` and `PermissionsGuard`
2. Integration tests that verify the complete auth flow
3. E2E tests that check role-specific and permission-specific access rules

Run the tests with:

```bash
npm run test
npm run test:e2e
```

## Frontend Integration

To integrate with the frontend:

1. Include the user's role in the JWT payload during login
2. Store the role securely in frontend state management
3. Implement conditional rendering based on user roles:

```jsx
// React example with role-based rendering
function Dashboard() {
  const { user } = useAuth();
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Role-based UI elements */}
      {user.role === 'ADMIN' && <AdminPanel />}
      {user.role === 'ORGANIZER' && <OrganizerTools />}
      {user.role === 'STAFF' && <StaffDashboard />}
      
      {/* Permission-based UI elements */}
      {hasPermission(user, 'create_event') && <CreateEventButton />}
      {hasPermission(user, 'view_reports') && <ReportsSection />}
    </div>
  );
}
```

## Best Practices

1. **Principle of Least Privilege**: Assign the minimum permissions necessary for users to perform their tasks.
2. **Separation of Concerns**: Keep role definitions, permission assignments, and guards modular.
3. **Centralized Management**: Use the `PermissionsService` to modify permission mappings in one place.
4. **Comprehensive Testing**: Always test both positive cases (allowed access) and negative cases (denied access).
5. **Detailed Error Messages**: Provide clear error messages when permission is denied (but avoid revealing sensitive system details).

## Maintenance and Extensions

To add new permissions:

1. Add the permission to the `Permission` enum
2. Update the `rolePermissionsMap` in `PermissionsService`
3. Apply the permission decorator where needed
4. Add tests for the new permission 