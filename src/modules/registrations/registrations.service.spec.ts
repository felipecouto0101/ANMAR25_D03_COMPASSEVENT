import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { QueryRegistrationsDto } from './dto/query-registrations.dto';
import { Registration } from '../../domain/entities/registration.entity';
import { Event } from '../../domain/entities/event.entity';
import { 
  EntityNotFoundException, 
  ValidationException, 
  AuthorizationException, 
  ConflictException 
} from '../../domain/exceptions/domain.exceptions';

describe('RegistrationsService', () => {
  let service: RegistrationsService;
  let registrationRepository: any;
  let eventRepository: any;
  let userRepository: any;
  let mailService: any;

  const mockRegistration: Registration = {
    id: 'registration-id',
    userId: 'user-id',
    eventId: 'event-id',
    active: true,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  const mockEvent: Event = {
    id: 'event-id',
    name: 'Test Event',
    description: 'Test Description',
    date: '2025-12-15T09:00:00.000Z',
    location: 'Test Location',
    imageUrl: 'http://example.com/image.jpg',
    organizerId: 'organizer-id',
    active: true,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  const mockUser = {
    id: 'user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'participant',
    active: true,
  };

  const mockDateString = '2023-01-01T00:00:00.000Z';

  beforeEach(async () => {
    const mockRegistrationRepository = {
      create: jest.fn().mockResolvedValue(mockRegistration),
      findById: jest.fn().mockResolvedValue(mockRegistration),
      findByUserAndEvent: jest.fn().mockResolvedValue(null),
      findByUser: jest.fn().mockResolvedValue({ items: [mockRegistration], total: 1 }),
      update: jest.fn().mockResolvedValue(mockRegistration),
      delete: jest.fn().mockResolvedValue(true),
    };

    const mockEventRepository = {
      findById: jest.fn().mockResolvedValue(mockEvent),
    };

    const mockUserRepository = {
      findById: jest.fn().mockResolvedValue(mockUser),
    };

    const mockMailService = {
      sendRegistrationConfirmationEmail: jest.fn().mockResolvedValue(undefined),
      sendRegistrationCancelledEmail: jest.fn().mockResolvedValue(undefined),
    };

    service = new RegistrationsService(
      mockRegistrationRepository as any,
      mockEventRepository as any,
      mockUserRepository as any,
      mockMailService as any
    );

    registrationRepository = mockRegistrationRepository;
    eventRepository = mockEventRepository;
    userRepository = mockUserRepository;
    mailService = mockMailService;

    jest.spyOn(Date, 'now').mockImplementation(() => new Date(mockDateString).getTime());
    jest.spyOn(global.console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new registration', async () => {
      const createRegistrationDto: CreateRegistrationDto = {
        eventId: 'event-id',
      };

      const result = await service.create('user-id', createRegistrationDto);

      expect(userRepository.findById).toHaveBeenCalledWith('user-id');
      expect(eventRepository.findById).toHaveBeenCalledWith('event-id');
      expect(registrationRepository.findByUserAndEvent).toHaveBeenCalledWith('user-id', 'event-id');
      expect(registrationRepository.create).toHaveBeenCalled();
      expect(mailService.sendRegistrationConfirmationEmail).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe('registration-id');
      expect(result.userId).toBe('user-id');
      expect(result.event.id).toBe('event-id');
    });

    it('should throw EntityNotFoundException when user is not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      const createRegistrationDto: CreateRegistrationDto = {
        eventId: 'event-id',
      };

      await expect(
        service.create('nonexistent-id', createRegistrationDto),
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw AuthorizationException when user role is not participant or organizer', async () => {
      userRepository.findById.mockResolvedValueOnce({
        ...mockUser,
        role: 'admin',
      });

      const createRegistrationDto: CreateRegistrationDto = {
        eventId: 'event-id',
      };

      await expect(
        service.create('admin-id', createRegistrationDto),
      ).rejects.toThrow(AuthorizationException);
    });

    it('should throw EntityNotFoundException when event is not found', async () => {
      eventRepository.findById.mockResolvedValueOnce(null);

      const createRegistrationDto: CreateRegistrationDto = {
        eventId: 'nonexistent-event-id',
      };

      await expect(
        service.create('user-id', createRegistrationDto),
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw ValidationException when event is inactive', async () => {
      eventRepository.findById.mockResolvedValueOnce({
        ...mockEvent,
        active: false,
      });

      const createRegistrationDto: CreateRegistrationDto = {
        eventId: 'inactive-event-id',
      };

      await expect(
        service.create('user-id', createRegistrationDto),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException when event is in the past', async () => {
      eventRepository.findById.mockResolvedValueOnce({
        ...mockEvent,
        date: '2020-01-01T00:00:00.000Z',
      });

      const createRegistrationDto: CreateRegistrationDto = {
        eventId: 'past-event-id',
      };

      await expect(
        service.create('user-id', createRegistrationDto),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw ConflictException when user is already registered for the event', async () => {
      registrationRepository.findByUserAndEvent.mockResolvedValueOnce({
        ...mockRegistration,
        active: true,
      });

      const createRegistrationDto: CreateRegistrationDto = {
        eventId: 'event-id',
      };

      await expect(
        service.create('user-id', createRegistrationDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow registration if previous registration was cancelled', async () => {
      registrationRepository.findByUserAndEvent.mockResolvedValueOnce({
        ...mockRegistration,
        active: false,
      });

      const createRegistrationDto: CreateRegistrationDto = {
        eventId: 'event-id',
      };

      const result = await service.create('user-id', createRegistrationDto);

      expect(registrationRepository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all registrations for a user', async () => {
      const queryDto: QueryRegistrationsDto = {
        page: 1,
        limit: 10,
      };

      const result = await service.findAll('user-id', queryDto, 'user-id');

      expect(registrationRepository.findByUser).toHaveBeenCalledWith('user-id', 1, 10);
      expect(eventRepository.findById).toHaveBeenCalledWith('event-id');
      expect(result).toBeDefined();
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should throw AuthorizationException when requesting other user registrations', async () => {
      const queryDto: QueryRegistrationsDto = {
        page: 1,
        limit: 10,
      };

      await expect(
        service.findAll('user-id', queryDto, 'different-user-id'),
      ).rejects.toThrow(AuthorizationException);
    });

    it('should use default pagination values when not provided', async () => {
      const queryDto: QueryRegistrationsDto = {};

      await service.findAll('user-id', queryDto, 'user-id');

      expect(registrationRepository.findByUser).toHaveBeenCalledWith('user-id', 1, 10);
    });

    it('should throw EntityNotFoundException when event is not found', async () => {
      eventRepository.findById.mockResolvedValueOnce(null);

      const queryDto: QueryRegistrationsDto = {
        page: 1,
        limit: 10,
      };

      await expect(
        service.findAll('user-id', queryDto, 'user-id'),
      ).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('delete', () => {
    it('should cancel a registration', async () => {
      const result = await service.delete('registration-id', 'user-id');

      expect(registrationRepository.findById).toHaveBeenCalledWith('registration-id');
      expect(registrationRepository.update).toHaveBeenCalledWith('registration-id', {
        active: false,
        updatedAt: expect.any(String),
      });
      expect(userRepository.findById).toHaveBeenCalledWith('user-id');
      expect(eventRepository.findById).toHaveBeenCalledWith('event-id');
      expect(mailService.sendRegistrationCancelledEmail).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw EntityNotFoundException when registration is not found', async () => {
      registrationRepository.findById.mockResolvedValueOnce(null);

      await expect(
        service.delete('nonexistent-id', 'user-id'),
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw AuthorizationException when user is not the registration owner', async () => {
      registrationRepository.findById.mockResolvedValueOnce({
        ...mockRegistration,
        userId: 'different-user-id',
      });

      await expect(
        service.delete('registration-id', 'user-id'),
      ).rejects.toThrow(AuthorizationException);
    });

    it('should handle case when user is not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      const result = await service.delete('registration-id', 'user-id');

      expect(mailService.sendRegistrationCancelledEmail).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle case when event is not found', async () => {
      eventRepository.findById.mockResolvedValueOnce(null);

      const result = await service.delete('registration-id', 'user-id');

      expect(mailService.sendRegistrationCancelledEmail).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
});