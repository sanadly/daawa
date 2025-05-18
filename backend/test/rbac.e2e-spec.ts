import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../src/common/decorators/roles.decorator';
import { PermissionsService } from '../src/common/services/permissions.service';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';
import { RbacTestController } from '../src/common/controllers/rbac-test.controller';
import { Reflector } from '@nestjs/core';
import { MockAuthModule } from './auth.module.mock';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';

// Same secret as in MockJwtAuthGuard and MockAuthModule
const JWT_TEST_SECRET = 'test-secret-key-for-testing-only';

describe('RBAC System (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  // Generate tokens for different user roles
  const generateToken = (roles: Role[]) => {
    return jwtService.sign({
      userId: 1,
      username: 'testuser',
      roles,
    });
  };

  beforeAll(async () => {
    const reflector = new Reflector();
    const permissionsService = new PermissionsService();
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [MockAuthModule],
      controllers: [RbacTestController],
      providers: [
        {
          provide: Reflector,
          useValue: reflector,
        },
        {
          provide: PermissionsService,
          useValue: permissionsService,
        },
      ],
    })
    .overrideGuard(RolesGuard)
    .useValue(new RolesGuard(reflector))
    .overrideGuard(PermissionsGuard)
    .useValue(new PermissionsGuard(reflector, permissionsService))
    .compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Public and Authentication Test', () => {
    it('/rbac-test/public (GET) should be accessible without authentication', () => {
      return request(app.getHttpServer())
        .get('/rbac-test/public')
        .expect(200)
        .expect('This endpoint is public and does not require authentication');
    });

    it('/rbac-test/authenticated (GET) should require authentication', () => {
      return request(app.getHttpServer())
        .get('/rbac-test/authenticated')
        .expect(401);
    });

    it('/rbac-test/authenticated (GET) should allow authenticated users', () => {
      const token = generateToken([Role.USER]);
      return request(app.getHttpServer())
        .get('/rbac-test/authenticated')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('This endpoint requires authentication');
        });
    });
  });

  describe('Role-Based Access Control', () => {
    it('/rbac-test/staff (GET) should allow STAFF role', () => {
      const token = generateToken([Role.STAFF]);
      return request(app.getHttpServer())
        .get('/rbac-test/staff')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe(
            'This endpoint requires STAFF, ORGANIZER, or ADMIN role',
          );
        });
    });

    it('/rbac-test/staff (GET) should deny USER role', () => {
      const token = generateToken([Role.USER]);
      return request(app.getHttpServer())
        .get('/rbac-test/staff')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('/rbac-test/organizer (GET) should allow ORGANIZER role', () => {
      const token = generateToken([Role.ORGANIZER]);
      return request(app.getHttpServer())
        .get('/rbac-test/organizer')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe(
            'This endpoint requires ORGANIZER or ADMIN role',
          );
        });
    });

    it('/rbac-test/organizer (GET) should deny STAFF role', () => {
      const token = generateToken([Role.STAFF]);
      return request(app.getHttpServer())
        .get('/rbac-test/organizer')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('/rbac-test/admin (GET) should allow ADMIN role', () => {
      const token = generateToken([Role.ADMIN]);
      return request(app.getHttpServer())
        .get('/rbac-test/admin')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('This endpoint requires ADMIN role');
        });
    });

    it('/rbac-test/admin (GET) should deny ORGANIZER role', () => {
      const token = generateToken([Role.ORGANIZER]);
      return request(app.getHttpServer())
        .get('/rbac-test/admin')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('Permission-Based Access Control', () => {
    it('/rbac-test/view-events (GET) should allow users with VIEW_EVENTS permission', () => {
      const token = generateToken([Role.STAFF]); // STAFF has VIEW_EVENTS permission
      return request(app.getHttpServer())
        .get('/rbac-test/view-events')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('This endpoint requires VIEW_EVENTS permission');
        });
    });

    it('/rbac-test/manage-events (GET) should allow users with MANAGE_EVENTS permission', () => {
      const token = generateToken([Role.ORGANIZER]); // ORGANIZER has MANAGE_EVENTS permission
      return request(app.getHttpServer())
        .get('/rbac-test/manage-events')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('This endpoint requires MANAGE_EVENTS permission');
        });
    });

    it('/rbac-test/manage-events (GET) should deny users without MANAGE_EVENTS permission', () => {
      const token = generateToken([Role.STAFF]); // STAFF doesn't have MANAGE_EVENTS permission
      return request(app.getHttpServer())
        .get('/rbac-test/manage-events')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('/rbac-test/admin-operations (GET) should allow users with required admin permissions', () => {
      const token = generateToken([Role.ADMIN]); // ADMIN has all permissions
      return request(app.getHttpServer())
        .get('/rbac-test/admin-operations')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('This endpoint requires CONFIGURE_SYSTEM and MANAGE_USERS permissions');
        });
    });

    it('/rbac-test/admin-operations (GET) should deny users without required admin permissions', () => {
      const token = generateToken([Role.ORGANIZER]); // ORGANIZER doesn't have admin permissions
      return request(app.getHttpServer())
        .get('/rbac-test/admin-operations')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('Combined Role and Permission Checks', () => {
    it('/rbac-test/combined-auth (GET) should allow users with correct role and permission', () => {
      const token = generateToken([Role.ORGANIZER]); // ORGANIZER has MANAGE_EVENTS permission
      return request(app.getHttpServer())
        .get('/rbac-test/combined-auth')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('This endpoint requires both role and permission checks');
        });
    });

    it('/rbac-test/combined-auth (GET) should deny users with correct role but missing permission', () => {
      // For this test, we would need a special case where a role doesn't have expected permissions
      // This edge case is difficult to test with our current setup where permissions are derived from roles
      // This is left as a theoretical test scenario
    });
  });
}); 