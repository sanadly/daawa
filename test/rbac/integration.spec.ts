import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../../src/common/decorators/roles.decorator';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('RBAC Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  const generateTokenForRole = (role: Role) => {
    const payload = { sub: 1, email: `${role.toLowerCase()}@example.com`, role };
    return jwtService.sign(payload);
  };

  describe('Admin Controller', () => {
    it('should allow ADMIN to access admin/dashboard', async () => {
      const adminToken = generateTokenForRole(Role.ADMIN);
      
      return request(app.getHttpServer())
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('Admin dashboard');
        });
    });

    it('should deny STAFF access to admin/dashboard', async () => {
      const staffToken = generateTokenForRole(Role.STAFF);
      
      return request(app.getHttpServer())
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);
    });
  });

  describe('Organizer Controller', () => {
    it('should allow ORGANIZER to access organizer/events', async () => {
      const organizerToken = generateTokenForRole(Role.ORGANIZER);
      
      return request(app.getHttpServer())
        .get('/organizer/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('Organizer events');
        });
    });

    it('should allow ADMIN to access organizer/events', async () => {
      const adminToken = generateTokenForRole(Role.ADMIN);
      
      return request(app.getHttpServer())
        .get('/organizer/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should deny STAFF access to organizer/events', async () => {
      const staffToken = generateTokenForRole(Role.STAFF);
      
      return request(app.getHttpServer())
        .get('/organizer/events')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);
    });
  });

  describe('Staff Controller', () => {
    it('should allow STAFF to access staff/events', async () => {
      const staffToken = generateTokenForRole(Role.STAFF);
      
      return request(app.getHttpServer())
        .get('/staff/events')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('Events retrieved');
        });
    });

    it('should allow ORGANIZER to access staff/events', async () => {
      const organizerToken = generateTokenForRole(Role.ORGANIZER);
      
      return request(app.getHttpServer())
        .get('/staff/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(200);
    });

    it('should allow ADMIN to access staff/events', async () => {
      const adminToken = generateTokenForRole(Role.ADMIN);
      
      return request(app.getHttpServer())
        .get('/staff/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should deny USER access to staff/events', async () => {
      const userToken = generateTokenForRole(Role.USER);
      
      return request(app.getHttpServer())
        .get('/staff/events')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('Permission-based access', () => {
    it('should allow STAFF to access check-in endpoint with CHECK_IN_ATTENDEE permission', async () => {
      const staffToken = generateTokenForRole(Role.STAFF);
      
      return request(app.getHttpServer())
        .post('/staff/check-in/1/1')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('checked in');
        });
    });

    it('should deny STAFF access to admin users endpoint without MANAGE_USERS permission', async () => {
      const staffToken = generateTokenForRole(Role.STAFF);
      
      return request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);
    });

    it('should allow ADMIN to access any endpoint with any permission', async () => {
      const adminToken = generateTokenForRole(Role.ADMIN);
      
      // Test an endpoint that requires a permission admins have
      return request(app.getHttpServer())
        .get('/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
}); 