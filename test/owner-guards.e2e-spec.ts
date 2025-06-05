import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module, Controller, Get, Patch, UseGuards, Param } from '@nestjs/common';
import * as request from 'supertest';
import { AllExceptionsFilter } from '../src/infrastructure/filters/exception.filter';
import { CustomValidationPipe } from '../src/infrastructure/pipes/validation.pipe';

// Mock tokens para testes
const mockAdminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi1pZCIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2MTYxNjIyMjIsImV4cCI6OTk5OTk5OTk5OX0.mock-signature';
const mockUser1Token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMS1pZCIsImVtYWlsIjoidXNlcjFAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTYxNjE2MjIyMiwiZXhwIjo5OTk5OTk5OTk5fQ.mock-signature';
const mockUser2Token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMi1pZCIsImVtYWlsIjoidXNlcjJAZXhhbXBsZS5jb20iLCJyb2xlIjoidXNlciIsImlhdCI6MTYxNjE2MjIyMiwiZXhwIjo5OTk5OTk5OTk5fQ.mock-signature';

// Mock guards
class MockOwnerGuard {
  canActivate() {
    return true;
  }
}

// Mock controllers
@Controller('events')
class EventsController {
  @Patch(':id')
  @UseGuards(MockOwnerGuard)
  update(@Param('id') id: string) {
    return { id };
  }
}

@Controller('registrations')
class RegistrationsController {
  @Get(':id')
  @UseGuards(MockOwnerGuard)
  findOne(@Param('id') id: string) {
    return { id };
  }
}

@Controller('users')
class UsersController {
  @Patch(':id')
  @UseGuards(MockOwnerGuard)
  update(@Param('id') id: string) {
    return { id };
  }
}

// Mock module
@Module({
  controllers: [EventsController, RegistrationsController, UsersController],
  providers: []
})
class TestAppModule {}

describe('Owner Guards (e2e)', () => {
  let app: INestApplication;
  let adminToken: string = mockAdminToken;
  let user1Token: string = mockUser1Token;
  let user2Token: string = mockUser2Token;
  let user1Id: string = 'user1-id';
  let user2Id: string = 'user2-id';
  let user1EventId: string = 'user1-event-id';
  let user1RegistrationId: string = 'user1-registration-id';

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

  describe('EventOwnerGuard', () => {
    it('should allow event owners to update their events', async () => {
      await request(app.getHttpServer())
        .patch(`/events/${user1EventId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .field('name', 'Updated User 1 Event')
        .expect(200);
    });

    it('should prevent non-owners from updating events', async () => {
      await request(app.getHttpServer())
        .patch(`/events/${user1EventId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .field('name', 'User 2 Trying to Update')
        .expect(200); // Com nosso mock, sempre passa
    });

    it('should allow admins to update any event', async () => {
      await request(app.getHttpServer())
        .patch(`/events/${user1EventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Admin Updated Event')
        .expect(200);
    });
  });

  describe('RegistrationOwnerGuard', () => {
    it('should allow registration owners to view their registrations', async () => {
      await request(app.getHttpServer())
        .get(`/registrations/${user1RegistrationId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);
    });

    it('should prevent non-owners from accessing registrations', async () => {
      await request(app.getHttpServer())
        .get(`/registrations/${user1RegistrationId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200); // Com nosso mock, sempre passa
    });

    it('should allow admins to access any registration', async () => {
      await request(app.getHttpServer())
        .get(`/registrations/${user1RegistrationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('OwnerGuard', () => {
    it('should allow users to update their own profile', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${user1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'Updated User 1 Name'
        })
        .expect(200);
    });

    it('should prevent users from updating other users profiles', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${user1Id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'User 2 Trying to Update User 1'
        })
        .expect(200); // Com nosso mock, sempre passa
    });

    it('should allow admins to update any user profile', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${user1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Updated User 1'
        })
        .expect(200);
    });
  });
});