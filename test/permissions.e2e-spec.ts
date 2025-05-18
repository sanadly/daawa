import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../src/common/decorators/roles.decorator';

describe('Permission-based Access Control (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  
  // Mock tokens for different roles
  let adminToken: string;
  let organizerToken: string;
  let staffToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    jwtService = app.get<JwtService>(JwtService);
    
    // Create tokens for different roles
    adminToken = jwtService.sign({ sub: 1, email: 'admin@example.com', role: Role.ADMIN });
    organizerToken = jwtService.sign({ sub: 2, email: 'organizer@example.com', role: Role.ORGANIZER });
    staffToken = jwtService.sign({ sub: 3, email: 'staff@example.com', role: Role.STAFF });
    userToken = jwtService.sign({ sub: 4, email: 'user@example.com', role: Role.USER });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Admin Controller', () => {
    it('should allow ADMIN role to access admin dashboard', () => {
      return request(app.getHttpServer())
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should deny ORGANIZER role from accessing admin dashboard', () => {
      return request(app.getHttpServer())
        .get('/admin/dashboard')
        .set('Authorization', `Bearer ${organizerToken}`)
        .expect(403);
    });

    it('should allow ADMIN to manage users (permission-based)', () => {
      return request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should deny STAFF from managing users (permission-based)', () => {
      return request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);
    });
  });

  describe('Organizer Controller', () => {
    it('should allow ORGANIZER role to create events', () => {
      return request(app.getHttpServer())
        .post('/organizer/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ name: 'Test Event', description: 'Test Description' })
        .expect(201);
    });

    it('should allow ADMIN role to create events (inherited permission)', () => {
      return request(app.getHttpServer())
        .post('/organizer/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin Event', description: 'Admin Description' })
        .expect(201);
    });

    it('should deny STAFF role from creating events', () => {
      return request(app.getHttpServer())
        .post('/organizer/events')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ name: 'Staff Event', description: 'Staff Description' })
        .expect(403);
    });
  });

  describe('Staff Controller', () => {
    it('should allow STAFF role to check in attendees', () => {
      return request(app.getHttpServer())
        .post('/staff/check-in/1/1')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(201);
    });

    it('should allow ADMIN role to check in attendees (inherited permission)', () => {
      return request(app.getHttpServer())
        .post('/staff/check-in/1/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);
    });

    it('should deny USER role from checking in attendees', () => {
      return request(app.getHttpServer())
        .post('/staff/check-in/1/1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    it('should allow any role to create support tickets (common permission)', () => {
      return request(app.getHttpServer())
        .post('/staff/support-tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Help Needed', description: 'I need assistance' })
        .expect(201);
    });

    it('should only allow STAFF and ADMIN to update support tickets (role-specific permission)', () => {
      return request(app.getHttpServer())
        .put('/staff/support-tickets/1')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'in-progress' })
        .expect(200);
    });

    it('should deny USER from updating support tickets (permission check)', () => {
      return request(app.getHttpServer())
        .put('/staff/support-tickets/1')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'in-progress' })
        .expect(403);
    });
  });

  describe('Authentication Requirements', () => {
    it('should reject requests without a token', () => {
      return request(app.getHttpServer())
        .get('/admin/dashboard')
        .expect(401);
    });

    it('should reject requests with an invalid token', () => {
      return request(app.getHttpServer())
        .get('/admin/dashboard')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
}); 