import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { QueryRegistrationsDto } from './dto/query-registrations.dto';
import { RegistrationResponseDto } from './dto/registration-response.dto';

describe('RegistrationsController', () => {
  let controller: RegistrationsController;
  let registrationsService: RegistrationsService;

  const mockRegistrationResponse = {
    id: 'registration-id',
    userId: 'user-id',
    event: {
      id: 'event-id',
      name: 'Test Event',
      description: 'Test Description',
      date: '2025-12-15T09:00:00.000Z',
      location: 'Test Location',
      imageUrl: 'http://example.com/image.jpg',
    },
    createdAt: '2023-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    const mockRegistrationsService = {
      create: jest.fn().mockResolvedValue(mockRegistrationResponse),
      findAll: jest.fn().mockResolvedValue({ items: [mockRegistrationResponse], total: 1 }),
      delete: jest.fn().mockResolvedValue(true),
    };

    controller = new RegistrationsController(mockRegistrationsService as any);
    registrationsService = mockRegistrationsService as any;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new registration', async () => {
      const createRegistrationDto: CreateRegistrationDto = {
        eventId: 'event-id',
      };

      const req = {
        user: { id: 'user-id' },
      };

      const result = await controller.create(createRegistrationDto, req);

      expect(registrationsService.create).toHaveBeenCalledWith('user-id', createRegistrationDto);
      expect(result).toEqual(mockRegistrationResponse);
    });

    it('should use mock user ID when user is not in request', async () => {
      const createRegistrationDto: CreateRegistrationDto = {
        eventId: 'event-id',
      };

      const req = {};

      await controller.create(createRegistrationDto, req);

      expect(registrationsService.create).toHaveBeenCalledWith('mock-user-id', createRegistrationDto);
    });
  });

  describe('findAll', () => {
    it('should return all registrations for a user', async () => {
      const queryDto: QueryRegistrationsDto = {
        page: 1,
        limit: 10,
      };

      const req = {
        user: { id: 'user-id' },
      };

      const result = await controller.findAll('user-id', queryDto, req);

      expect(registrationsService.findAll).toHaveBeenCalledWith('user-id', queryDto, 'user-id');
      expect(result).toEqual({ items: [mockRegistrationResponse], total: 1 });
    });

    it('should use mock user ID when user is not in request', async () => {
      const queryDto: QueryRegistrationsDto = {
        page: 1,
        limit: 10,
      };

      const req = {};

      await controller.findAll('user-id', queryDto, req);

      expect(registrationsService.findAll).toHaveBeenCalledWith('user-id', queryDto, 'mock-user-id');
    });
  });

  describe('remove', () => {
    it('should cancel a registration', async () => {
      const req = {
        user: { id: 'user-id' },
      };

      const result = await controller.remove('registration-id', req);

      expect(registrationsService.delete).toHaveBeenCalledWith('registration-id', 'user-id');
      expect(result).toBe(true);
    });

    it('should use mock user ID when user is not in request', async () => {
      const req = {};

      await controller.remove('registration-id', req);

      expect(registrationsService.delete).toHaveBeenCalledWith('registration-id', 'mock-user-id');
    });
  });
});