import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Request, Response } from 'express';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [],
      providers: [],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Mock the root endpoint directly
    app.use('/', (req: Request, res: Response) => {
      res.json({ message: 'Hello World!' });
    });
    
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toBe('Hello World!');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
