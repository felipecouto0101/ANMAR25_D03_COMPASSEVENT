import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module, Controller, Get, UseGuards } from '@nestjs/common';
import * as request from 'supertest';
import { AllExceptionsFilter } from '../src/infrastructure/filters/exception.filter';
import { CustomValidationPipe } from '../src/infrastructure/pipes/validation.pipe';


const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE2MTYyMjIyLCJleHAiOjk5OTk5OTk5OTl9.mock-signature';


class MockJwtAuthGuard {
  canActivate() {
    return true;
  }
}

class MockRolesGuard {
  canActivate() {
    return true;
  }
}


@Controller('auth-guards')
class TestController {
  @Get('jwt-protected')
  @UseGuards(MockJwtAuthGuard)
  getJwtProtected() {
    return { message: 'JWT protected route' };
  }
  
  @Get('roles-protected')
  @UseGuards(MockJwtAuthGuard, MockRolesGuard)
  getRolesProtected() {
    return { message: 'Roles protected route' };
  }
}


@Module({
  controllers: [TestController],
  providers: []
})
class TestAppModule {}

describe('Auth Guards (e2e)', () => {
  let app: INestApplication;
  let authToken: string = mockJwtToken;

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

  describe('JwtAuthGuard', () => {
    it('should protect routes with JwtAuthGuard', async () => {
      await request(app.getHttpServer())
        .get('/auth-guards/jwt-protected')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.message).toBe('JWT protected route');
        });
    });
  });

  describe('RolesGuard', () => {
    it('should protect routes with RolesGuard', async () => {
      await request(app.getHttpServer())
        .get('/auth-guards/roles-protected')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.message).toBe('Roles protected route');
        });
    });
  });
});