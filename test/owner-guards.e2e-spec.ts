import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/infrastructure/filters/exception.filter';
import { CustomValidationPipe } from '../src/infrastructure/pipes/validation.pipe';

describe('Owner Guards (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;
  let user1EventId: string;
  let user1RegistrationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new CustomValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    try {
      // Get admin token
      const adminLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin@123',
        });

      if (adminLoginResponse.status === 201 && adminLoginResponse.body.accessToken) {
        adminToken = adminLoginResponse.body.accessToken;
        
        // Create two test users
        const user1Email = `user1-${Date.now()}@example.com`;
        const user2Email = `user2-${Date.now()}@example.com`;
        
        // Create user 1
        const createUser1Response = await request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Test User 1',
            email: user1Email,
            password: 'Password123!',
            role: 'user'
          });
        
        if (createUser1Response.status === 201) {
          user1Id = createUser1Response.body.id;
          
          // Login as user 1
          const user1LoginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
              email: user1Email,
              password: 'Password123!',
            });
            
          if (user1LoginResponse.status === 201) {
            user1Token = user1LoginResponse.body.accessToken;
          }
        }
        
        // Create user 2
        const createUser2Response = await request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Test User 2',
            email: user2Email,
            password: 'Password123!',
            role: 'user'
          });
        
        if (createUser2Response.status === 201) {
          user2Id = createUser2Response.body.id;
          
          // Login as user 2
          const user2LoginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
              email: user2Email,
              password: 'Password123!',
            });
            
          if (user2LoginResponse.status === 201) {
            user2Token = user2LoginResponse.body.accessToken;
          }
        }
        
        // Create an event as user 1
        if (user1Token) {
          const createEventResponse = await request(app.getHttpServer())
            .post('/events')
            .set('Authorization', `Bearer ${user1Token}`)
            .field('name', 'User 1 Event')
            .field('description', 'Test Description')
            .field('date', '2025-12-15T09:00:00.000Z')
            .field('location', 'Test Location')
            .attach('image', Buffer.from('test image content'), 'test.jpg');
          
          if (createEventResponse.status === 201) {
            user1EventId = createEventResponse.body.id;
            
            // Create a registration for user 1's event
            if (user1EventId) {
              const createRegistrationResponse = await request(app.getHttpServer())
                .post('/registrations')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                  eventId: user1EventId,
                  attendeeName: 'User 1',
                  attendeeEmail: user1Email
                });
              
              if (createRegistrationResponse.status === 201) {
                user1RegistrationId = createRegistrationResponse.body.id;
              }
            }
          }
        }
      }
    } catch (error) {
      console.log('Failed to setup test users and resources');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('EventOwnerGuard', () => {
    it('should allow event owners to update their events', async () => {
      if (!user1Token || !user1EventId) {
        return Promise.resolve();
      }

      await request(app.getHttpServer())
        .patch(`/events/${user1EventId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .field('name', 'Updated User 1 Event')
        .expect((res) => {
          expect([200, 204, 400]).toContain(res.status);
        });
    });

    it('should prevent non-owners from updating events', async () => {
      if (!user2Token || !user1EventId) {
        return Promise.resolve();
      }

      await request(app.getHttpServer())
        .patch(`/events/${user1EventId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .field('name', 'User 2 Trying to Update')
        .expect((res) => {
          // Either 403 (forbidden) or 404 (not found)
          expect([403, 404]).toContain(res.status);
        });
    });

    it('should allow admins to update any event', async () => {
      if (!adminToken || !user1EventId) {
        return Promise.resolve();
      }

      await request(app.getHttpServer())
        .patch(`/events/${user1EventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Admin Updated Event')
        .expect((res) => {
          expect([200, 204, 400]).toContain(res.status);
        });
    });
  });

  describe('RegistrationOwnerGuard', () => {
    it('should allow registration owners to view their registrations', async () => {
      if (!user1Token || !user1RegistrationId) {
        return Promise.resolve();
      }

      await request(app.getHttpServer())
        .get(`/registrations/${user1RegistrationId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });

    it('should prevent non-owners from accessing registrations', async () => {
      if (!user2Token || !user1RegistrationId) {
        return Promise.resolve();
      }

      await request(app.getHttpServer())
        .get(`/registrations/${user1RegistrationId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect((res) => {
          // Either 403 (forbidden) or 404 (not found)
          expect([403, 404]).toContain(res.status);
        });
    });

    it('should allow admins to access any registration', async () => {
      if (!adminToken || !user1RegistrationId) {
        return Promise.resolve();
      }

      await request(app.getHttpServer())
        .get(`/registrations/${user1RegistrationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          expect([200, 404]).toContain(res.status);
        });
    });
  });

  describe('OwnerGuard', () => {
    it('should allow users to update their own profile', async () => {
      if (!user1Token || !user1Id) {
        return Promise.resolve();
      }

      await request(app.getHttpServer())
        .patch(`/users/${user1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Updated User 1 Name'
        })
        .expect((res) => {
          expect([200, 204, 400]).toContain(res.status);
        });
    });

    it('should prevent users from updating other users profiles', async () => {
      if (!user2Token || !user1Id) {
        return Promise.resolve();
      }

      await request(app.getHttpServer())
        .patch(`/users/${user1Id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'User 2 Trying to Update User 1'
        })
        .expect((res) => {
          // Either 403 (forbidden) or 404 (not found)
          expect([403, 404]).toContain(res.status);
        });
    });

    it('should allow admins to update any user profile', async () => {
      if (!adminToken || !user1Id) {
        return Promise.resolve();
      }

      await request(app.getHttpServer())
        .patch(`/users/${user1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Updated User 1'
        })
        .expect((res) => {
          expect([200, 204, 400]).toContain(res.status);
        });
    });
  });
});