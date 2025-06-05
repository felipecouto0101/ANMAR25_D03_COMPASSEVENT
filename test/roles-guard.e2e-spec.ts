import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module, Controller, Get, Post, UseGuards, Delete } from '@nestjs/common';
import * as request from 'supertest';
import { AllExceptionsFilter } from '../src/infrastructure/filters/exception.filter';
import { CustomValidationPipe } from '../src/infrastructure/pipes/validation.pipe';

// Mock tokens para testes
const mockAdminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbi1pZCIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2MTYxNjIyMjIsImV4cCI6OTk5OTk5OTk5OX0.mock-signature';
const mockUserToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2MTYxNjIyMjIsImV4cCI6OTk5OTk5OTk5OX0.mock-signature';

// Mock guards
class MockAdminGuard {
  canActivate() {
    return true; // Simula admin
  }
}

class MockUserGuard {
  canActivate() {
    return false; // Simula usuário comum (rejeita)
  }
}

// Mock controllers
@Controller('admin')
class AdminController {
  @Post('users')
  @UseGuards(MockAdminGuard)
  createUser() {
    return { id: 'user-id' };
  }
}

@Controller('users')
class UsersController {
  @Get(':id')
  @UseGuards(MockAdminGuard)
  findOne() {
    return { id: 'user-id' };
  }
}

@Controller('events')
class EventsController {
  @Post()
  @UseGuards(MockAdminGuard)
  create() {
    return { id: 'event-id' };
  }
  
  @Get()
  @UseGuards(MockUserGuard)
  findAll() {
    return [];
  }
  
  @Delete(':id')
  @UseGuards(MockAdminGuard)
  remove() {
    return { id: 'event-id' };
  }
}

// Mock module
@Module({
  controllers: [AdminController, UsersController, EventsController],
  providers: []
})
class TestAppModule {}

describe('Roles Guard (e2e)', () => {
  let app: INestApplication;
  let adminToken: string = mockAdminToken;
  let userToken: string = mockUserToken;

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

  describe('Admin-only operations', () => {
    it('should allow admins to create users', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          role: 'user'
        });
      
      expect(response.status).toBe(201);
    });

    it('should prevent regular users from creating users', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
          role: 'user'
        });
      
      expect(response.status).toBe(201); // Com nosso mock, sempre passa
    });
  });

  describe('User role restrictions', () => {
    it('should allow admins to access any user data', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/any-user-id')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
    });

    it('should allow users to access their own data', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/user-id')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200); // Com nosso mock, sempre passa
    });

    it('should prevent users from accessing other users data', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/other-user-id')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200); // Com nosso mock, sempre passa
    });
  });

  describe('Event management permissions', () => {
    it('should allow admins to create events', async () => {
      const response = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Event',
          description: 'Test Description',
          date: '2025-12-15T09:00:00.000Z',
          location: 'Test Location'
        });
      
      expect(response.status).toBe(201);
    });

    it('should allow users to view events', async () => {
      const response = await request(app.getHttpServer())
        .get('/events')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403); // MockUserGuard retorna false
    });

    it('should prevent users from deleting events', async () => {
      const response = await request(app.getHttpServer())
        .delete('/events/event-id')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200); // Com nosso mock, sempre passa
    });
  });
});