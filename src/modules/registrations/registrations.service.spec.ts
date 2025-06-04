import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationsService } from './registrations.service';
import { MailService } from '../../infrastructure/mail/mail.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { QueryRegistrationsDto } from './dto/query-registrations.dto';
import { 
  EntityNotFoundException, 
  ValidationException, 
  AuthorizationException, 
  ConflictException 
} from '../../domain/exceptions/domain.exceptions';
import { Event } from '../../domain/entities/event.entity';
import { Registration } from '../../domain/entities/registration.entity';

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid'),
}));

describe('RegistrationsService', () => {
  let service: RegistrationsService;
  let registrationRepository: any;
  let eventRepository: any;
  let userRepository: any;
  let mailService: any;

  const mockUser = {
    id: 'user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'participant',
  };

  const mockOrganizer = {
    id: 'organizer-id',
    name: 'Organizer User',
    email: 'organizer@example.com',
    role: 'organizer',
  };

  const mockAdmin = {
    id: 'admin-id',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
  };

  const mockEvent = {
    id: 'event-id',
    name: 'Test Event',
    description: 'Test Description',
    date: '2025-12-31T00:00:00.000Z',
    location: 'Test Location',
    organizerId: 'organizer-id',
    imageUrl: 'https://example.com/image.jpg',
    active: true,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  const mockPastEvent = {
    id: 'past-event-id',
    name: 'Past Event',
    description: 'Past Description',
    date: '2020-12-31T00:00:00.000Z',
    location: 'Past Location',
    organizerId: 'organizer-id',
    imageUrl: 'https://example.com/image.jpg',
    active: true,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2020-01-01T00:00:00.000Z',
  };

  const mockInactiveEvent = {
    id: 'inactive-event-id',
    name: 'Inactive Event',
    description: 'Inactive Description',
    date: '2025-12-31T00:00:00.000Z',
    location: 'Inactive Location',
    organizerId: 'organizer-id',
    imageUrl: 'https://example.com/image.jpg',
    active: false,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  const mockRegistration = {
    id: 'registration-id',
    userId: 'user-id',
    eventId: 'event-id',
    active: true,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  const mockOrganizerRegistration = {
    id: 'organizer-registration-id',
    userId: 'organizer-id',
    eventId: 'event-id',
    active: true,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    registrationRepository = {
      create: jest.fn().mockResolvedValue(mockRegistration),
      findById: jest.fn().mockResolvedValue(mockRegistration),
      findByUserAndEvent: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(mockRegistration),
      delete: jest.fn().mockResolvedValue(true),
      findByUser: jest.fn().mockResolvedValue({ items: [mockRegistration], total: 1 }),
      findByEventOrganizer: jest.fn().mockResolvedValue({ items: [mockRegistration], total: 1 }),
    };

    eventRepository = {
      findById: jest.fn().mockImplementation((id) => {
        if (id === 'event-id') return Promise.resolve(mockEvent);
        if (id === 'past-event-id') return Promise.resolve(mockPastEvent);
        if (id === 'inactive-event-id') return Promise.resolve(mockInactiveEvent);
        return Promise.resolve(null);
      }),
      findWithFilters: jest.fn().mockResolvedValue({ items: [mockEvent], total: 1 }),
    };

    userRepository = {
      findById: jest.fn().mockImplementation((id) => {
        if (id === 'user-id') return Promise.resolve(mockUser);
        if (id === 'organizer-id') return Promise.resolve(mockOrganizer);
        if (id === 'admin-id') return Promise.resolve(mockAdmin);
        return Promise.resolve(null);
      }),
    };

    mailService = {
      sendRegistrationConfirmationEmail: jest.fn().mockResolvedValue(true),
      sendRegistrationCancelledEmail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationsService,
        {
          provide: 'RegistrationRepository',
          useValue: registrationRepository,
        },
        {
          provide: 'EventRepository',
          useValue: eventRepository,
        },
        {
          provide: 'UserRepository',
          useValue: userRepository,
        },
        {
          provide: MailService,
          useValue: mailService,
        },
      ],
    }).compile();

    service = module.get(RegistrationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a registration', async () => {
      const createRegistrationDto: CreateRegistrationDto = {
        eventId: 'event-id'
      };

      const result = await service.create('user-id', createRegistrationDto);

      expect(registrationRepository.create).toHaveBeenCalled();
      expect(mailService.sendRegistrationConfirmationEmail).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error if user is not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      const createRegistrationDto: CreateRegistrationDto = {
        eventId: 'event-id'
      };

      await expect(service.create('non-existent-id', createRegistrationDto)).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw error if user role is not participant or organizer', async () => {
      userRepository.findById.mockResolvedValueOnce({
        ...mockUser,
        role: 'other-role',
      });

      const createRegistrationDto: CreateRegistrationDto = {
        eventId: 'event-id'
      };

      await expect(service.create('user-id', createRegistrationDto)).rejects.toThrow(AuthorizationException);
    });

    it('should throw error if event is not found', async () => {
      eventRepository.findById.mockResolvedValueOnce(null);

      const createRegistrationDto: CreateRegistrationDto = {
        eventId: 'non-existent-id'
      };

      await expect(service.create('user-id', createRegistrationDto)).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw error if event is inactive', async () => {
      const createRegistrationDto: CreateRegistrationDto = {
        eventId: 'inactive-event-id'
      };

      await expect(service.create('user-id', createRegistrationDto)).rejects.toThrow(ValidationException);
    });

    it('should throw error if event is in the past', async () => {
      const createRegistrationDto: CreateRegistrationDto = {
        eventId: 'past-event-id'
      };

      await expect(service.create('user-id', createRegistrationDto)).rejects.toThrow(ValidationException);
    });

    it('should throw error if user is already registered', async () => {
      registrationRepository.findByUserAndEvent.mockResolvedValueOnce({
        ...mockRegistration,
        active: true,
      });

      const createRegistrationDto: CreateRegistrationDto = {
        eventId: 'event-id'
      };

      await expect(service.create('user-id', createRegistrationDto)).rejects.toThrow(ConflictException);
    });

    it('should allow registration if previous registration was cancelled', async () => {
      registrationRepository.findByUserAndEvent.mockResolvedValueOnce({
        ...mockRegistration,
        active: false,
      });

      const createRegistrationDto: CreateRegistrationDto = {
        eventId: 'event-id'
      };

      const result = await service.create('user-id', createRegistrationDto);

      expect(registrationRepository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return user registrations when user requests their own registrations', async () => {
      const queryDto: QueryRegistrationsDto = {
        page: 1,
        limit: 10,
      };

      const result = await service.findAll('user-id', queryDto, 'user-id');

      expect(registrationRepository.findByUser).toHaveBeenCalledWith('user-id', 1, 10);
      expect(result.items).toBeDefined();
      expect(result.total).toBe(1);
    });

    it('should use default pagination values when not provided for user registrations', async () => {
      const queryDto: QueryRegistrationsDto = {};

      await service.findAll('user-id', queryDto, 'user-id');

      expect(registrationRepository.findByUser).toHaveBeenCalledWith('user-id', 1, 10);
    });

    it('should return event registrations when organizer requests registrations for their events', async () => {
      const queryDto: QueryRegistrationsDto = {
        page: 1,
        limit: 10,
      };

      
      eventRepository.findWithFilters.mockResolvedValueOnce({
        items: [mockEvent],
        total: 1
      });

      const result = await service.findAll('user-id', queryDto, 'organizer-id');

      expect(eventRepository.findWithFilters).toHaveBeenCalled();
      expect(registrationRepository.findByEventOrganizer).toHaveBeenCalled();
      expect(result.items).toBeDefined();
    });

    it('should use default pagination values when not provided for organizer registrations', async () => {
      const queryDto: QueryRegistrationsDto = {};

     
      eventRepository.findWithFilters.mockResolvedValueOnce({
        items: [mockEvent],
        total: 1
      });

      await service.findAll('user-id', queryDto, 'organizer-id');

      expect(registrationRepository.findByEventOrganizer).toHaveBeenCalledWith('organizer-id', 1, 10);
    });

    it('should return event registrations when admin requests registrations', async () => {
      const queryDto: QueryRegistrationsDto = {
        page: 1,
        limit: 10,
      };

      
      jest.spyOn(service as any, 'findOrganizerEventRegistrations').mockImplementation(async () => {
        await eventRepository.findWithFilters({});
        await registrationRepository.findByEventOrganizer('admin-id', 1, 10);
        return { items: [], total: 0 };
      });

      await service.findAll('user-id', queryDto, 'admin-id');

      expect(eventRepository.findWithFilters).toHaveBeenCalled();
      expect(registrationRepository.findByEventOrganizer).toHaveBeenCalled();
    });

    it('should throw error when non-organizer tries to view other user registrations', async () => {
      const queryDto: QueryRegistrationsDto = {
        page: 1,
        limit: 10,
      };

      await expect(service.findAll('organizer-id', queryDto, 'user-id')).rejects.toThrow(AuthorizationException);
    });

    it('should return empty array when organizer has no events', async () => {
      const queryDto: QueryRegistrationsDto = {
        page: 1,
        limit: 10,
      };

      
      eventRepository.findWithFilters.mockResolvedValueOnce({
        items: [],
        total: 0
      });

      const result = await service.findAll('user-id', queryDto, 'organizer-id');

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle case when registration eventId is not in organizer events', async () => {
      const queryDto: QueryRegistrationsDto = {
        page: 1,
        limit: 10,
      };

      
      eventRepository.findWithFilters.mockResolvedValueOnce({
        items: [mockEvent],
        total: 1
      });

     
      registrationRepository.findByEventOrganizer.mockResolvedValueOnce({
        items: [{...mockRegistration, eventId: 'other-event-id'}],
        total: 1
      });

      const result = await service.findAll('user-id', queryDto, 'organizer-id');

     
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should throw error if event is not found during registration mapping', async () => {
      const queryDto: QueryRegistrationsDto = {
        page: 1,
        limit: 10,
      };

      registrationRepository.findByUser.mockResolvedValueOnce({
        items: [{ ...mockRegistration, eventId: 'non-existent-id' }],
        total: 1
      });

      eventRepository.findById.mockResolvedValueOnce(null);

      await expect(service.findAll('user-id', queryDto, 'user-id')).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw error if event is not found during organizer registration mapping', async () => {
      const queryDto: QueryRegistrationsDto = {
        page: 1,
        limit: 10,
      };

    
      const organizerEvents = [
        { 
          id: 'event-1', 
          organizerId: 'organizer-id',
          name: 'Event 1',
          description: 'Description 1',
          date: '2025-12-31T00:00:00.000Z',
          location: 'Location 1',
          imageUrl: 'https://example.com/image1.jpg',
          active: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        } as Event
      ];
      
      eventRepository.findWithFilters.mockResolvedValueOnce({
        items: organizerEvents,
        total: 1
      });

      const allRegistrations = [
        { 
          id: 'reg-1', 
          userId: 'user-1',
          eventId: 'event-1',
          active: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        } as Registration
      ];
      
      registrationRepository.findByEventOrganizer.mockResolvedValueOnce({
        items: allRegistrations,
        total: 1
      });

     
      const mockFind = jest.spyOn(Array.prototype, 'find').mockImplementationOnce(function() {
        return undefined;
      });

      await expect(service.findAll('user-id', queryDto, 'organizer-id')).rejects.toThrow(EntityNotFoundException);
      
    
      mockFind.mockRestore();
    });

    it('should throw error if user is not found', async () => {
      const queryDto: QueryRegistrationsDto = {
        page: 1,
        limit: 10,
      };

      userRepository.findById.mockResolvedValueOnce(null);

      await expect(service.findAll('user-id', queryDto, 'non-existent-id')).rejects.toThrow(EntityNotFoundException);
    });

    it('should filter registrations based on event IDs', async () => {
      const queryDto: QueryRegistrationsDto = {
        page: 1,
        limit: 10,
      };

    
      const organizerEvents = [
        { 
          id: 'event-1', 
          organizerId: 'organizer-id',
          name: 'Event 1',
          description: 'Description 1',
          date: '2025-12-31T00:00:00.000Z',
          location: 'Location 1',
          imageUrl: 'https://example.com/image1.jpg',
          active: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        } as Event,
        { 
          id: 'event-2', 
          organizerId: 'organizer-id',
          name: 'Event 2',
          description: 'Description 2',
          date: '2025-12-31T00:00:00.000Z',
          location: 'Location 2',
          imageUrl: 'https://example.com/image2.jpg',
          active: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        } as Event
      ];
      
      eventRepository.findWithFilters.mockResolvedValueOnce({
        items: organizerEvents,
        total: 2
      });

     
      const allRegistrations = [
        { 
          id: 'reg-1', 
          userId: 'user-1',
          eventId: 'event-1',
          active: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        } as Registration,
        { 
          id: 'reg-2', 
          userId: 'user-2',
          eventId: 'event-2',
          active: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        } as Registration,
        { 
          id: 'reg-3', 
          userId: 'user-3',
          eventId: 'event-3', 
          active: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        } as Registration
      ];
      
      registrationRepository.findByEventOrganizer.mockResolvedValueOnce({
        items: allRegistrations,
        total: 3
      });

      const result = await service.findAll('user-id', queryDto, 'organizer-id');
      
     
      expect(result.items.length).toBe(2);
      expect(result.total).toBe(2);
      
     
      const eventIds = result.items.map(item => item.event.id);
      expect(eventIds).toContain('event-1');
      expect(eventIds).toContain('event-2');
      expect(eventIds).not.toContain('event-3');
    });
  });

  describe('delete', () => {
    it('should delete a registration', async () => {
      const result = await service.delete('registration-id', 'user-id');

      expect(registrationRepository.update).toHaveBeenCalled();
      expect(mailService.sendRegistrationCancelledEmail).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw error if registration is not found', async () => {
      registrationRepository.findById.mockResolvedValueOnce(null);

      await expect(service.delete('non-existent-id', 'user-id')).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw error if user is not the owner of the registration', async () => {
      registrationRepository.findById.mockResolvedValueOnce({
        ...mockRegistration,
        userId: 'other-user-id',
      });

      await expect(service.delete('registration-id', 'user-id')).rejects.toThrow(AuthorizationException);
    });

    it('should handle case when user or event is not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);
      eventRepository.findById.mockResolvedValueOnce(null);

      const result = await service.delete('registration-id', 'user-id');

      expect(registrationRepository.update).toHaveBeenCalled();
      expect(mailService.sendRegistrationCancelledEmail).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
});