import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/infrastructure/filters/exception.filter';
import { CustomValidationPipe } from '../src/infrastructure/pipes/validation.pipe';


describe('Registrations (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new CustomValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should require authentication for registrations endpoint', () => {
    return request(app.getHttpServer())
      .post('/registrations')
      .send({ eventId: '550e8400-e29b-41d4-a716-446655440000' })
      .expect(401);
  });

  it('should require authentication for getting user registrations', () => {
    return request(app.getHttpServer())
      .get('/registrations/user/some-user-id')
      .expect(401);
  });

  it('should require authentication for cancelling registration', () => {
    return request(app.getHttpServer())
      .delete('/registrations/some-registration-id')
      .expect(401);
  });
});