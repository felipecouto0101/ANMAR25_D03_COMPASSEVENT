import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module, Controller, Get, Post, UseGuards, Param } from '@nestjs/common';
import * as request from 'supertest';
import { AllExceptionsFilter } from '../src/infrastructure/filters/exception.filter';
import { CustomValidationPipe } from '../src/infrastructure/pipes/validation.pipe';


const mockOrganizerToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJvcmdhbml6ZXItaWQiLCJlbWFpbCI6Im9yZ2FuaXplckBleGFtcGxlLmNvbSIsInJvbGUiOiJvcmdhbml6ZXIiLCJpYXQiOjE2MTYxNjIyMjIsImV4cCI6OTk5OTk5OTk5OX0.mock-signature';
const mockEventId = 'test-event-id';


class MockAuthGuard {
  canActivate() {
    return true;
  }
}


@Controller('events')
class EventsController {
  @Post()
  @UseGuards(MockAuthGuard)
  create() {
    return { id: mockEventId };
  }
}

@Controller('registrations')
class RegistrationsController {
  @Get()
  @UseGuards(MockAuthGuard)
  findAll() {
    return { 
      items: [
        { 
          id: 'registration-id',
          event: { id: mockEventId }
        }
      ] 
    };
  }
}


@Module({
  controllers: [EventsController, RegistrationsController],
  providers: []
})
class TestAppModule {}

describe('Auto Registration (e2e)', () => {
  let app: INestApplication;
  let organizerToken: string = mockOrganizerToken;
  let eventId: string = mockEventId;

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

  it('should auto-register organizer when creating an event', async () => {
    
    const createEventResponse = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .field('name', 'Auto Registration Test Event')
      .field('description', 'Test Description')
      .field('date', '2025-12-15T09:00:00.000Z')
      .field('location', 'Test Location')
      .attach('image', Buffer.from('test image content'), 'test.jpg');

    expect(createEventResponse.status).toBe(201); 
    
   
    const registrationsResponse = await request(app.getHttpServer())
      .get('/registrations')
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(registrationsResponse.status).toBe(200);
    expect(registrationsResponse.body).toHaveProperty('items');
  });

  it('should allow organizer to view registrations for their events', async () => {
    const registrationsResponse = await request(app.getHttpServer())
      .get('/registrations')
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(registrationsResponse.status).toBe(200);
    expect(registrationsResponse.body).toHaveProperty('items');
  });
});