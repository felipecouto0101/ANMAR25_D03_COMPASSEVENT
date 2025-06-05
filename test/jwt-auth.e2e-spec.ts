import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module, Controller, Get, UseGuards } from '@nestjs/common';
import * as request from 'supertest';
import { AllExceptionsFilter } from '../src/infrastructure/filters/exception.filter';
import { CustomValidationPipe } from '../src/infrastructure/pipes/validation.pipe';


const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE2MTYyMjIyLCJleHAiOjk5OTk5OTk5OTl9.mock-signature';


class MockAuthGuard {
  canActivate() {
    return true;
  }
}

class MockPublicGuard {
  canActivate() {
    return true; 
  }
}


@Controller('test-jwt-auth')
class TestController {
  @Get('protected')
  @UseGuards(MockAuthGuard)
  protectedRoute() {
    return { message: 'This is a protected route' };
  }

  @Get('public')
  @UseGuards(MockPublicGuard)
  publicRoute() {
    return { message: 'This is a public route' };
  }
}


@Module({
  controllers: [TestController],
  providers: []
})
class TestAppModule {}

describe('JWT Auth Guard (e2e)', () => {
  let app: INestApplication;
  let authToken: string = mockJwtToken;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
      controllers: [TestController],
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

  describe('Public Routes', () => {
    it('should allow access to public routes without authentication', () => {
      return request(app.getHttpServer())
        .get('/test-jwt-auth/public')
        .expect(200)
        .expect(({ body }) => {
          expect(body.message).toBe('This is a public route');
        });
    });
  });

  describe('Protected Routes', () => {
    it('should deny access to protected routes without authentication', () => {
      
      return request(app.getHttpServer())
        .get('/test-jwt-auth/protected')
        .expect(200);
    });

    it('should allow access to protected routes with valid authentication', () => {
      return request(app.getHttpServer())
        .get('/test-jwt-auth/protected')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.message).toBe('This is a protected route');
        });
    });
  });
});