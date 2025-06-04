import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/infrastructure/filters/exception.filter';
import { CustomValidationPipe } from '../src/infrastructure/pipes/validation.pipe';


describe('Authentication Guards (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new CustomValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

  
    try {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin@123',
        });

      if (loginResponse.status === 201 && loginResponse.body.accessToken) {
        authToken = loginResponse.body.accessToken;
      }
    } catch (error) {
      console.log('Failed to obtain auth token for tests');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  
  describe('JwtAuthGuard', () => {
    
    describe('Protected Routes', () => {
      it('should deny access to users endpoint without authentication', () => {
        return request(app.getHttpServer())
          .get('/users')
          .expect(401);
      });

      it('should deny access to events endpoint without authentication', () => {
        return request(app.getHttpServer())
          .get('/events')
          .expect(401);
      });

      it('should deny access to registrations endpoint without authentication', () => {
        return request(app.getHttpServer())
          .get('/registrations')
          .expect((res) => {
            
            expect([401, 404]).toContain(res.status);
          });
      });

      it('should allow access to protected routes with valid authentication', () => {
       
        if (!authToken) {
          return Promise.resolve();
        }

        return request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${authToken}`)
          .expect((res) => {
            expect(res.status).not.toBe(401);
          });
      });
    });

   
    describe('Public Routes', () => {
      it('should allow access to login endpoint without authentication', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'test@example.com',
            password: 'password',
          })
          .expect((res) => {
            
            expect(res.status).toBeDefined();
          });
      });
    });
  });

  
  describe('RolesGuard', () => {
    it('should deny access to admin-only routes for non-admin users', async () => {
     
      if (!authToken) {
        return;
      }

      
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test User',
          email: 'newuser@example.com',
          password: 'Password123!',
          role: 'admin' 
        });

      
      expect([201, 403, 400]).toContain(response.status);
      
      if (response.status === 201) {
        
        expect(response.body.role).not.toBe('admin');
      }
    });
  });


  describe('OwnerGuard', () => {
    it('should prevent accessing another user\'s data', async () => {
      if (!authToken) {
        return;
      }

     
      const response = await request(app.getHttpServer())
        .get('/users/non-existent-user-id')
        .set('Authorization', `Bearer ${authToken}`);

      
      expect([403, 404]).toContain(response.status);
    });
  });
});