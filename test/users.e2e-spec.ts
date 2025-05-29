import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/infrastructure/filters/exception.filter';
import { CustomValidationPipe } from '../src/infrastructure/pipes/validation.pipe';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let participantToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new CustomValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin@123',
      })
      .expect(201); 

    adminToken = adminLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Registration and Management', () => {
    it('should create a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Test User',
          email: 'testuser@example.com',
          password: 'Test@123',
          phone: '1234567890',
          role: 'participant',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('testuser@example.com');
      expect(response.body.role).toBe('participant');
      
      userId = response.body.id;
    });

    it('should not allow duplicate email', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Duplicate User',
          email: 'testuser@example.com',
          password: 'Test@123',
          phone: '0987654321',
          role: 'participant',
        })
        .expect(409);
    });

    it('should login with new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'Test@123',
        })
        .expect(201);

      participantToken = response.body.accessToken;
      expect(response.body.user.role).toBe('participant');
    });

    it('should allow admin to list all users', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .then(response => {
          expect(response.body).toHaveProperty('items');
          expect(response.body).toHaveProperty('total');
          expect(Array.isArray(response.body.items)).toBe(true);
        });
    });

    it('should not allow participant to list all users', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(403);
    });

    it('should allow user to access their own profile', () => {
      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200)
        .then(response => {
          expect(response.body.id).toBe(userId);
        });
    });

    it('should allow admin to access any user profile', () => {
      return request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should not allow user to access another user profile', async () => {
      
      const createUserResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Another User',
          email: 'another@example.com',
          password: 'Another@123',
          phone: '5555555555',
          role: 'participant',
        })
        .expect(201); 
      

      return request(app.getHttpServer())
        .get(`/users/${createUserResponse.body.id}`)
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(403);
    });
  });
});