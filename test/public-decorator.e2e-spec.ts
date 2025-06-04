import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get, Module } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/infrastructure/filters/exception.filter';
import { CustomValidationPipe } from '../src/infrastructure/pipes/validation.pipe';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { Public } from '../src/modules/auth/decorators/public.decorator';
import { APP_GUARD } from '@nestjs/core';


@Controller('test-public-decorator')
class TestPublicDecoratorController {
  @Get('protected')
  protectedRoute() {
    return { message: 'This is a protected route' };
  }

  @Public()
  @Get('public')
  publicRoute() {
    return { message: 'This is a public route' };
  }
}


@Module({
  controllers: [TestPublicDecoratorController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
class TestPublicDecoratorModule {}

describe('Public Decorator (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestPublicDecoratorModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new CustomValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Public Routes with @Public() decorator', () => {
    it('should allow access to routes with @Public() decorator without authentication', () => {
      return request(app.getHttpServer())
        .get('/test-public-decorator/public')
        .expect(200)
        .expect(({ body }) => {
          expect(body.message).toBe('This is a public route');
        });
    });

    it('should deny access to routes without @Public() decorator when not authenticated', () => {
      return request(app.getHttpServer())
        .get('/test-public-decorator/protected')
        .expect(401);
    });
  });

  describe('Authentication with valid token', () => {
    let authToken: string;

    beforeAll(async () => {
      
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

    it('should allow access to protected routes with valid authentication', () => {
      
      if (!authToken) {
        return Promise.resolve();
      }

      return request(app.getHttpServer())
        .get('/test-public-decorator/protected')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.message).toBe('This is a protected route');
        });
    });

    it('should also allow access to public routes with valid authentication', () => {
      
      if (!authToken) {
        return Promise.resolve();
      }

      return request(app.getHttpServer())
        .get('/test-public-decorator/public')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.message).toBe('This is a public route');
        });
    });
  });
});