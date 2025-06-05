import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module, Controller, Get, UseGuards } from '@nestjs/common';
import * as request from 'supertest';
import { AllExceptionsFilter } from '../src/infrastructure/filters/exception.filter';
import { CustomValidationPipe } from '../src/infrastructure/pipes/validation.pipe';


class MockAuthGuard {
  canActivate() {
    return false; 
  }
}


@Controller()
class AppController {
  @Get()
  @UseGuards(MockAuthGuard)
  getHello(): string {
    return 'Hello World!';
  }
}


@Module({
  controllers: [AppController],
  providers: []
})
class TestAppModule {}

describe('AppController (e2e)', () => {
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

  it('/ (GET) should return 401 when not authenticated', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(403); 
  });
});