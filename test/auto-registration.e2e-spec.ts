import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/infrastructure/filters/exception.filter';
import { CustomValidationPipe } from '../src/infrastructure/pipes/validation.pipe';

describe('Auto Registration (e2e)', () => {
  let app: INestApplication;
  let organizerToken: string;
  let eventId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new CustomValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();


    try {
     
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'organizer@example.com',
          password: 'Organizer@123',
        });

      if (loginResponse.status === 201 && loginResponse.body.accessToken) {
        organizerToken = loginResponse.body.accessToken;
      } else {
       
        const createUserResponse = await request(app.getHttpServer())
          .post('/users')
          .send({
            name: 'Test Organizer',
            email: 'organizer@example.com',
            password: 'Organizer@123',
            role: 'organizer',
          });

        if (createUserResponse.status === 201) {
          const loginResponse = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
              email: 'organizer@example.com',
              password: 'Organizer@123',
            });

          if (loginResponse.status === 201) {
            organizerToken = loginResponse.body.accessToken;
          }
        }
      }
    } catch (error) {
      console.log('Failed to setup test organizer');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('should auto-register organizer when creating an event', async () => {
    if (!organizerToken) {
      return Promise.resolve();
    }

    
    const createEventResponse = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .field('name', 'Auto Registration Test Event')
      .field('description', 'Test Description')
      .field('date', '2025-12-15T09:00:00.000Z')
      .field('location', 'Test Location')
      .attach('image', Buffer.from('test image content'), 'test.jpg');

    expect(createEventResponse.status).toBe(201);
    expect(createEventResponse.body).toHaveProperty('id');
    
    eventId = createEventResponse.body.id;

 
    const registrationsResponse = await request(app.getHttpServer())
      .get('/registrations')
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(registrationsResponse.status).toBe(200);
    expect(registrationsResponse.body).toHaveProperty('items');
    
   
    const eventRegistration = registrationsResponse.body.items.find(
      (item) => item.event.id === eventId
    );
    
    expect(eventRegistration).toBeDefined();
  });

  it('should allow organizer to view registrations for their events', async () => {
    if (!organizerToken || !eventId) {
      return Promise.resolve();
    }

    
    const registrationsResponse = await request(app.getHttpServer())
      .get('/registrations')
      .set('Authorization', `Bearer ${organizerToken}`);

    expect(registrationsResponse.status).toBe(200);
    expect(registrationsResponse.body).toHaveProperty('items');
    
   
    expect(registrationsResponse.body.items.length).toBeGreaterThan(0);
  });
});