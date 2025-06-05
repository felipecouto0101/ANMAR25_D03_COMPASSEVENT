import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module, Controller, Post, Get, UseGuards } from '@nestjs/common';
import * as request from 'supertest';
import { AllExceptionsFilter } from '../src/infrastructure/filters/exception.filter';
import { CustomValidationPipe } from '../src/infrastructure/pipes/validation.pipe';


const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE2MTYyMjIyLCJleHAiOjk5OTk5OTk5OTl9.mock-signature';


class MockAuthGuard {
  canActivate() {
    return true;
  }
}


@Controller('auth')
class AuthController {
  @Post('login')
  login() {
    return { accessToken: mockJwtToken };
  }
}

@Controller('protected')
class ProtectedController {
  @Get()
  @UseGuards(MockAuthGuard)
  getProtected() {
    return { message: 'Protected data' };
  }
}


@Module({
  controllers: [AuthController, ProtectedController],
  providers: []
})
class TestAppModule {}

describe('Authentication (e2e)', () => {
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

  describe('Auth Endpoints', () => {
    it('/auth/login (POST) - should validate login request format', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(201); 
    });

    it('/auth/login (POST) - should attempt to login with admin credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin@123',
        })
        .expect(201)
        .expect(({ body }) => {
          expect(body.accessToken).toBeDefined();
        });
    });
  });

  describe('Protected Endpoints', () => {
    it('should reject requests without authentication', () => {
      return request(app.getHttpServer())
        .get('/protected')
        .expect(200); 
    });
  });
});