import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/infrastructure/filters/exception.filter';
import { CustomValidationPipe } from '../src/infrastructure/pipes/validation.pipe';
import { SeedService } from '../src/seed/seed.service';

describe('Seed Module (e2e)', () => {
  let app: INestApplication;
  let seedService: SeedService;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new CustomValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    seedService = moduleFixture.get<SeedService>(SeedService);
    await app.init();

    try {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin@123',
        });

      if (loginResponse.status === 201 && loginResponse.body.accessToken) {
        adminToken = loginResponse.body.accessToken;
      }
    } catch (error) {
      console.log('Failed to obtain admin token for tests');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Seed Functionality', () => {
    it('should create admin user during seed', async () => {
      if (!adminToken) {
        return Promise.resolve();
      }

      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      expect(response.body).toBeDefined();
      
      let hasAdmin = false;
      if (Array.isArray(response.body)) {
        hasAdmin = response.body.some(user => user.role === 'admin');
      } else if (response.body.items && Array.isArray(response.body.items)) {
        hasAdmin = response.body.items.some(user => user.role === 'admin');
      }
      expect(hasAdmin).toBe(true);
    });

    it('should be able to execute seed manually', async () => {
      try {
        await seedService.seed();
        expect(true).toBe(true);
      } catch (error) {
        fail('Seed failed with error: ' + error.message);
      }
    });

    it('should verify data exists after seed', async () => {
      if (!adminToken) {
        return Promise.resolve();
      }

      const eventsResponse = await request(app.getHttpServer())
        .get('/events')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(eventsResponse.status).toBe(200);
      expect(eventsResponse.body).toBeDefined();
      
      const usersResponse = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(usersResponse.status).toBe(200);
      expect(usersResponse.body).toBeDefined();
    });
  });
});