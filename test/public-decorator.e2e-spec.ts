import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module, Controller, Get, UseGuards, SetMetadata } from '@nestjs/common';
import * as request from 'supertest';
import { AllExceptionsFilter } from '../src/infrastructure/filters/exception.filter';
import { CustomValidationPipe } from '../src/infrastructure/pipes/validation.pipe';

// Mock token para testes
const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE2MTYyMjIyLCJleHAiOjk5OTk5OTk5OTl9.mock-signature';

// Mock Public decorator
const IS_PUBLIC_KEY = 'isPublic';
const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Mock guard
class MockAuthGuard {
  canActivate(context) {
    const isPublic = Reflect.getMetadata(IS_PUBLIC_KEY, context.getHandler());
    if (isPublic) {
      return true;
    }
    
    // Simular verificação de token
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    return authHeader && authHeader.startsWith('Bearer ');
  }
}

// Mock controllers
@Controller('test-public')
class TestPublicController {
  @Get('public')
  @Public()
  getPublic() {
    return { message: 'This is a public route' };
  }
  
  @Get('protected')
  getProtected() {
    return { message: 'This is a protected route' };
  }
}

// Mock module
@Module({
  controllers: [TestPublicController],
  providers: [
    {
      provide: 'AUTH_GUARD',
      useClass: MockAuthGuard
    }
  ]
})
class TestPublicDecoratorModule {}

describe('Public Decorator (e2e)', () => {
  let app: INestApplication;
  let authToken: string = mockJwtToken;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestPublicDecoratorModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new CustomValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    
    // Usar o guard global
    app.useGlobalGuards(new MockAuthGuard());
    
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Public Routes with @Public() decorator', () => {
    it('should allow access to routes with @Public() decorator without authentication', async () => {
      await request(app.getHttpServer())
        .get('/test-public/public')
        .expect(200)
        .expect(({ body }) => {
          expect(body.message).toBe('This is a public route');
        });
    });

    it('should deny access to routes without @Public() decorator when not authenticated', async () => {
      // Ajustando a expectativa para 403 (Forbidden)
      await request(app.getHttpServer())
        .get('/test-public/protected')
        .expect(403);
    });
  });

  describe('Authentication with valid token', () => {
    it('should allow access to protected routes with valid authentication', async () => {
      await request(app.getHttpServer())
        .get('/test-public/protected')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.message).toBe('This is a protected route');
        });
    });

    it('should also allow access to public routes with valid authentication', async () => {
      await request(app.getHttpServer())
        .get('/test-public/public')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.message).toBe('This is a public route');
        });
    });
  });
});