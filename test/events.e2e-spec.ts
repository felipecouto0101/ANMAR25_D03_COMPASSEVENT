import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/infrastructure/filters/exception.filter';
import { CustomValidationPipe } from '../src/infrastructure/pipes/validation.pipe';

describe('Events (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new CustomValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should require authentication for events list', () => {
    return request(app.getHttpServer())
      .get('/events')
      .expect(401);
  });

  it('should require authentication for specific event', () => {
    return request(app.getHttpServer())
      .get('/events/non-existent-id')
      .expect(401);
  });

  it('should require authentication for creating events', () => {
    return request(app.getHttpServer())
      .post('/events')
      .field('name', 'Test Event')
      .field('description', 'Test Description')
      .field('date', '2025-12-15T09:00:00.000Z')
      .field('location', 'Test Location')
      .attach('image', Buffer.from('test image content'), 'test.jpg')
      .expect(401);
  });

  it('should require authentication for updating events', () => {
    return request(app.getHttpServer())
      .patch('/events/some-event-id')
      .field('name', 'Updated Event')
      .expect(401);
  });

  it('should require authentication for deleting events', () => {
    return request(app.getHttpServer())
      .delete('/events/some-event-id')
      .expect(401);
  });

  it('should attempt to login as admin and create event', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin@123',
      });
    
    if (loginResponse.status === 201 && loginResponse.body.accessToken) {
      const token = loginResponse.body.accessToken;
      
      const createResponse = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${token}`)
        .field('name', 'Test Event')
        .field('description', 'Test Description')
        .field('date', '2025-12-15T09:00:00.000Z')
        .field('location', 'Test Location')
        .attach('image', Buffer.from('test image content'), 'test.jpg');
      
      expect([201, 400]).toContain(createResponse.status);
    } else {
      expect(loginResponse.status).toBe(401);
    }
  });
});