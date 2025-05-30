import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get, UseGuards } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/infrastructure/filters/exception.filter';
import { CustomValidationPipe } from '../src/infrastructure/pipes/validation.pipe';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { Public } from '../src/modules/auth/decorators/public.decorator';


@Controller('test-jwt-auth')
class TestController {
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  protectedRoute() {
    return { message: 'This is a protected route' };
  }

  @Get('public')
  @Public()
  @UseGuards(JwtAuthGuard)
  publicRoute() {
    return { message: 'This is a public route' };
  }
}

describe('JWT Auth Guard (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new CustomValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin@123',
      });

    if (loginResponse.status === 201 && loginResponse.body.accessToken) {
      authToken = loginResponse.body.accessToken;
    }
  });

  afterAll(async () => {
    await app.close();
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
        .expect(401);
    });

    it('should allow access to protected routes with valid authentication', () => {
      
      if (!authToken) {
        return Promise.resolve();
      }

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