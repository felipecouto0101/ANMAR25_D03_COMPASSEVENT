import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { S3Service } from '../../infrastructure/storage/s3/s3.service';
import { MailService } from '../../infrastructure/mail/mail.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { 
  EntityNotFoundException, 
  AuthorizationException, 
  ConflictException,
  ValidationException
} from '../../domain/exceptions/domain.exceptions';

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid'),
}));

describe('EventsService', () => {
  let service: EventsService;
  let eventRepository: any;
  let userRepository: any;
  let registrationRepository: any;
  let s3Service: any;
  let mailService: any;

  const mockUser = {
    id: 'user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'organizer',
  };

  const mockEvent = {
    id: 'event-id',
    name: 'Test Event',
    description: 'Test Description',
    date: '2023-12-31T00:00:00.000Z',
    location: 'Test Location',
    organizerId: 'user-id',
    imageUrl: 'https://example.com/image.jpg',
    active: true,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  const mockFile = {
    fieldname: 'image',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test'),
    size: 4,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    eventRepository = {
      create: jest.fn().mockResolvedValue(mockEvent),
      findById: jest.fn().mockResolvedValue(mockEvent),
      findByName: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(mockEvent),
      delete: jest.fn().mockResolvedValue(true),
      findWithFilters: jest.fn().mockResolvedValue({ items: [mockEvent], total: 1 }),
      findByDate: jest.fn().mockResolvedValue([mockEvent]),
    };

    userRepository = {
      findById: jest.fn().mockResolvedValue(mockUser),
    };

    registrationRepository = {
      create: jest.fn().mockResolvedValue({ id: 'registration-id' }),
      findByUserAndEvent: jest.fn().mockResolvedValue(null),
    };

    s3Service = {
      uploadFile: jest.fn().mockResolvedValue('https://example.com/image.jpg'),
    };

    mailService = {
      sendEventCreatedEmail: jest.fn().mockResolvedValue(true),
      sendEventDeletedEmail: jest.fn().mockResolvedValue(true),
      sendNewEventNotificationToParticipants: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: 'EventRepository',
          useValue: eventRepository,
        },
        {
          provide: 'UserRepository',
          useValue: userRepository,
        },
        {
          provide: 'RegistrationRepository',
          useValue: registrationRepository,
        },
        {
          provide: S3Service,
          useValue: s3Service,
        },
        {
          provide: MailService,
          useValue: mailService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an event and auto-register the organizer', async () => {
      const createEventDto: CreateEventDto = {
        name: 'New Event',
        description: 'New Description',
        date: '2023-12-31T00:00:00.000Z',
        location: 'New Location',
      };

      const result = await service.create(createEventDto, 'user-id', mockFile);

      expect(eventRepository.create).toHaveBeenCalled();
      expect(s3Service.uploadFile).toHaveBeenCalled();
      expect(mailService.sendEventCreatedEmail).toHaveBeenCalled();
      
      
      expect(registrationRepository.findByUserAndEvent).toHaveBeenCalledWith('user-id', mockEvent.id);
      expect(registrationRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-id',
        eventId: mockEvent.id,
        active: true
      }));
      
      expect(result).toEqual(mockEvent);
    });

    it('should not create duplicate registration if organizer is already registered', async () => {
      const createEventDto: CreateEventDto = {
        name: 'New Event',
        description: 'New Description',
        date: '2023-12-31T00:00:00.000Z',
        location: 'New Location',
      };

    
      registrationRepository.findByUserAndEvent.mockResolvedValueOnce({
        id: 'existing-registration',
        userId: 'user-id',
        eventId: mockEvent.id,
        active: true
      });

      await service.create(createEventDto, 'user-id', mockFile);

      
      expect(registrationRepository.findByUserAndEvent).toHaveBeenCalledWith('user-id', mockEvent.id);
      expect(registrationRepository.create).not.toHaveBeenCalled();
    });

    it('should throw error if user is not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      const createEventDto: CreateEventDto = {
        name: 'New Event',
        description: 'New Description',
        date: '2023-12-31T00:00:00.000Z',
        location: 'New Location',
      };

      await expect(service.create(createEventDto, 'user-id', mockFile)).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw error if user is not admin or organizer', async () => {
      userRepository.findById.mockResolvedValueOnce({
        ...mockUser,
        role: 'participant',
      });

      const createEventDto: CreateEventDto = {
        name: 'New Event',
        description: 'New Description',
        date: '2023-12-31T00:00:00.000Z',
        location: 'New Location',
      };

      await expect(service.create(createEventDto, 'user-id', mockFile)).rejects.toThrow(AuthorizationException);
    });

    it('should throw error if event with same name already exists', async () => {
      eventRepository.findByName.mockResolvedValueOnce(mockEvent);

      const createEventDto: CreateEventDto = {
        name: 'Test Event',
        description: 'New Description',
        date: '2023-12-31T00:00:00.000Z',
        location: 'New Location',
      };

      await expect(service.create(createEventDto, 'user-id', mockFile)).rejects.toThrow(ConflictException);
    });

    it('should throw error if image file is not provided', async () => {
      const createEventDto: CreateEventDto = {
        name: 'New Event',
        description: 'New Description',
        date: '2023-12-31T00:00:00.000Z',
        location: 'New Location',
      };

      await expect(service.create(createEventDto, 'user-id', null as any)).rejects.toThrow(ValidationException);
    });

    it('should handle error when sending notifications', async () => {
      const createEventDto: CreateEventDto = {
        name: 'New Event',
        description: 'New Description',
        date: '2023-12-31T00:00:00.000Z',
        location: 'New Location',
      };

      
      jest.spyOn(service as any, 'findParticipants').mockResolvedValueOnce([{ id: 'participant-id' }]);
      
      
      mailService.sendNewEventNotificationToParticipants.mockRejectedValueOnce(new Error('Failed to send'));
      
   
      const result = await service.create(createEventDto, 'user-id', mockFile);
      expect(result).toEqual(mockEvent);
    });
  });

  describe('findAll', () => {
    it('should return all events with filters', async () => {
      const queryDto: QueryEventsDto = {
        name: 'Test',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        active: true,
        page: 1,
        limit: 10,
      };

      const result = await service.findAll(queryDto);

      expect(eventRepository.findWithFilters).toHaveBeenCalledWith({
        name: 'Test',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        active: true,
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({ items: [mockEvent], total: 1 });
    });

    it('should use default pagination values', async () => {
      const queryDto: QueryEventsDto = {};

      await service.findAll(queryDto);

      expect(eventRepository.findWithFilters).toHaveBeenCalledWith({
        name: undefined,
        startDate: undefined,
        endDate: undefined,
        active: undefined,
        page: 1,
        limit: 10,
      });
    });
  });

  describe('findById', () => {
    it('should return an event by id', async () => {
      const result = await service.findById('event-id');
      expect(result).toEqual(mockEvent);
    });

    it('should throw error if event is not found', async () => {
      eventRepository.findById.mockResolvedValueOnce(null);
      await expect(service.findById('non-existent-id')).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('update', () => {
    it('should update an event', async () => {
      const updateEventDto: UpdateEventDto = {
        name: 'Updated Event',
        description: 'Updated Description',
      };

      const result = await service.update('event-id', updateEventDto, 'user-id', 'organizer');

      expect(eventRepository.update).toHaveBeenCalled();
      expect(result).toEqual(mockEvent);
    });

    it('should update an event with new image', async () => {
      const updateEventDto: UpdateEventDto = {
        name: 'Updated Event',
      };

      const result = await service.update('event-id', updateEventDto, 'user-id', 'organizer', mockFile);

      expect(s3Service.uploadFile).toHaveBeenCalled();
      expect(eventRepository.update).toHaveBeenCalled();
      expect(result).toEqual(mockEvent);
    });

    it('should throw error if event is not found', async () => {
      eventRepository.findById.mockResolvedValueOnce(null);

      const updateEventDto: UpdateEventDto = {
        name: 'Updated Event',
      };

      await expect(service.update('non-existent-id', updateEventDto, 'user-id', 'organizer')).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw error if user is not authorized', async () => {
      const updateEventDto: UpdateEventDto = {
        name: 'Updated Event',
      };

      await expect(service.update('event-id', updateEventDto, 'other-user-id', 'participant')).rejects.toThrow(AuthorizationException);
    });

    it('should allow admin to update any event', async () => {
      const updateEventDto: UpdateEventDto = {
        name: 'Updated Event',
      };

      const result = await service.update('event-id', updateEventDto, 'admin-id', 'admin');

      expect(eventRepository.update).toHaveBeenCalled();
      expect(result).toEqual(mockEvent);
    });

    it('should throw error if event name already exists', async () => {
      const updateEventDto: UpdateEventDto = {
        name: 'Existing Event',
      };

      eventRepository.findByName.mockResolvedValueOnce({
        ...mockEvent,
        id: 'other-event-id',
      });

      await expect(service.update('event-id', updateEventDto, 'user-id', 'organizer')).rejects.toThrow(ConflictException);
    });

    it('should not check name conflict if name is not changed', async () => {
      const updateEventDto: UpdateEventDto = {
        description: 'Updated Description',
      };

      await service.update('event-id', updateEventDto, 'user-id', 'organizer');

      expect(eventRepository.findByName).not.toHaveBeenCalled();
    });

    it('should not throw error if event with same name is the same event', async () => {
      const updateEventDto: UpdateEventDto = {
        name: 'Test Event',
      };

      eventRepository.findByName.mockResolvedValueOnce(mockEvent);

      const result = await service.update('event-id', updateEventDto, 'user-id', 'organizer');

      expect(result).toEqual(mockEvent);
    });

    it('should throw error if update fails', async () => {
      const updateEventDto: UpdateEventDto = {
        name: 'Updated Event',
      };

      eventRepository.update.mockResolvedValueOnce(null);

      await expect(service.update('event-id', updateEventDto, 'user-id', 'organizer')).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete an event', async () => {
      const result = await service.delete('event-id', 'user-id', 'organizer');

      expect(eventRepository.update).toHaveBeenCalledWith('event-id', {
        active: false,
        updatedAt: expect.any(String),
      });
      expect(mailService.sendEventDeletedEmail).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw error if event is not found', async () => {
      eventRepository.findById.mockResolvedValueOnce(null);

      await expect(service.delete('non-existent-id', 'user-id', 'organizer')).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw error if user is not authorized', async () => {
      await expect(service.delete('event-id', 'other-user-id', 'participant')).rejects.toThrow(AuthorizationException);
    });

    it('should allow admin to delete any event', async () => {
      const result = await service.delete('event-id', 'admin-id', 'admin');

      expect(eventRepository.update).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle case when organizer is not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      const result = await service.delete('event-id', 'user-id', 'organizer');

      expect(eventRepository.update).toHaveBeenCalled();
      expect(mailService.sendEventDeletedEmail).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('findByDate', () => {
    it('should return events by date', async () => {
      const result = await service.findByDate('2023-01-01');

      expect(eventRepository.findByDate).toHaveBeenCalledWith('2023-01-01');
      expect(result).toEqual([mockEvent]);
    });
  });
});