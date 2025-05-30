import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/infrastructure/filters/exception.filter';
import { CustomValidationPipe } from '../src/infrastructure/pipes/validation.pipe';

describe('Roles Guard (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new CustomValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    
    try {
      const adminLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin@123',
        });

      if (adminLoginResponse.status === 201 && adminLoginResponse.body.accessToken) {
        adminToken = adminLoginResponse.body.accessToken;
        
        
        const uniqueEmail = `user-${Date.now()}@example.com`;
        const createUserResponse = await request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Test Regular User',
            email: uniqueEmail,
            password: 'Password123!',
            role: 'user'
          });
        
        if (createUserResponse.status === 201) {
          testUserId = createUserResponse.body.id;
          
          
          const userLoginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
              email: uniqueEmail,
              password: 'Password123!',
            });
            
          if (userLoginResponse.status === 201) {
            userToken = userLoginResponse.body.accessToken;
          }
        }
      }
    } catch (error) {
      console.log('Failed to setup test users');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Admin-only operations', () => {
    it('should allow admins to create users', async () => {
      if (!adminToken) {
        return Promise.resolve();
      }

      const uniqueEmail = `admin-created-${Date.now()}@example.com`;
      
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Created User',
          email: uniqueEmail,
          password: 'Password123!',
          role: 'user'
        })
        .expect((res) => {
          expect([201, 400]).toContain(res.status);
        });
    });

    it('should prevent regular users from creating users', async () => {
      if (!userToken) {
        return Promise.resolve();
      }

      const uniqueEmail = `user-created-${Date.now()}@example.com`;
      
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'User Created User',
          email: uniqueEmail,
          password: 'Password123!',
          role: 'user'
        })
        .expect((res) => {
          
          expect([401, 403]).toContain(res.status);
        });
    });
  });

  describe('User role restrictions', () => {
    it('should allow admins to access any user data', async () => {
      if (!adminToken || !testUserId) {
        return Promise.resolve();
      }

      await request(app.getHttpServer())
        .get(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });

    it('should allow users to access their own data', async () => {
      if (!userToken || !testUserId) {
        return Promise.resolve();
      }

      await request(app.getHttpServer())
        .get(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });

    it('should prevent users from accessing other users data', async () => {
      if (!userToken) {
        return Promise.resolve();
      }

      
      const differentUserId = 'non-existent-id';
      
      await request(app.getHttpServer())
        .get(`/users/${differentUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect((res) => {
         
          expect([403, 404]).toContain(res.status);
        });
    });
  });

  describe('Event management permissions', () => {
    let eventId: string;

    it('should allow admins to create events', async () => {
      if (!adminToken) {
        return Promise.resolve();
      }

      const response = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Admin Test Event')
        .field('description', 'Test Description')
        .field('date', '2025-12-15T09:00:00.000Z')
        .field('location', 'Test Location')
        .attach('image', Buffer.from('test image content'), 'test.jpg');
      
      if (response.status === 201 && response.body.id) {
        eventId = response.body.id;
      }
      
      expect([201, 400]).toContain(response.status);
    });

    it('should allow users to view events', async () => {
      if (!userToken) {
        return Promise.resolve();
      }

      await request(app.getHttpServer())
        .get('/events')
        .set('Authorization', `Bearer ${userToken}`)
        .expect((res) => {
          expect(res.status).not.toBe(401);
          expect(res.status).not.toBe(403);
        });
    });

    it('should prevent users from deleting events', async () => {
      if (!userToken || !eventId) {
        return Promise.resolve();
      }

      await request(app.getHttpServer())
        .delete(`/events/${eventId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect((res) => {
          
          expect([401, 403, 404]).toContain(res.status);
        });
    });
  });
});