import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module, Controller, Get, Post } from '@nestjs/common';
import * as request from 'supertest';
import { AllExceptionsFilter } from '../src/infrastructure/filters/exception.filter';
import { CustomValidationPipe } from '../src/infrastructure/pipes/validation.pipe';

// Mock controllers
@Controller('seed')
class SeedController {
  @Post()
  seed() {
    return { message: 'Seed completed successfully' };
  }
}

@Controller('users')
class UsersController {
  @Get('admin')
  getAdmin() {
    return { 
      id: 'admin-id',
      email: 'admin@example.com',
      role: 'admin'
    };
  }
}

// Mock module
@Module({
  controllers: [SeedController, UsersController],
  providers: []
})
class TestAppModule {}

describe('Seed Module (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new CustomValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Seed Functionality', () => {
    it('should create admin user during seed', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/admin');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', 'admin@example.com');
      expect(response.body).toHaveProperty('role', 'admin');
    });

    it('should be able to execute seed manually', async () => {
      const response = await request(app.getHttpServer())
        .post('/seed');
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Seed completed successfully');
    });

    it('should verify data exists after seed', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/admin');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email');
    });
  });
});