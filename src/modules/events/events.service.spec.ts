import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { Event } from '../../domain/entities/event.entity';
import { 
  EntityNotFoundException, 
  AuthorizationException, 
  ConflictException,
  ValidationException
} from '../../domain/exceptions/domain.exceptions';

describe('EventsService', () => {
  let service: EventsService;
  let eventRepository: any;
  let userRepository: any;
  let s3Service: any;
  let mailService: any;

  const mockEvent: Event = {
    id: 'test-id',
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

  const mockFile = {
    fieldname: 'image',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test'),
    size: 1024,
  };

  const mockUser = {
    id: 'organizer-id',
    name: 'Organizer',
    email: 'organizer@example.com',
    role: 'organizer',
    active: true,
  };

  const mockDateString = '2023-01-01T00:00:00.000Z';

  beforeEach(async () => {
    const mockEventRepository = {
      create: jest.fn().mockResolvedValue(mockEvent),
      findWithFilters: jest.fn().mockResolvedValue({ items: [mockEvent], total: 1 }),
      findById: jest.fn().mockResolvedValue(mockEvent),
      findByName: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(mockEvent),
      findByDate: jest.fn().mockResolvedValue([mockEvent]),
      findAll: jest.fn().mockResolvedValue([mockEvent]),
      delete: jest.fn().mockResolvedValue(true),
    };

    const mockUserRepository = {
      findById: jest.fn().mockResolvedValue(mockUser),
      findByEmail: jest.fn().mockResolvedValue(mockUser),
      create: jest.fn().mockResolvedValue(mockUser),
      update: jest.fn().mockResolvedValue(mockUser),
      delete: jest.fn().mockResolvedValue(true),
      findAll: jest.fn().mockResolvedValue([mockUser]),
      findWithFilters: jest.fn().mockResolvedValue({ items: [mockUser], total: 1 }),
    };

    const mockS3Service = {
      uploadFile: jest.fn().mockResolvedValue('http://example.com/image.jpg')
    };

    const mockMailService = {
      sendEventCreatedEmail: jest.fn().mockResolvedValue(undefined),
      sendNewEventNotificationToParticipants: jest.fn().mockResolvedValue(undefined),
      sendEventDeletedEmail: jest.fn().mockResolvedValue(undefined)
    };

    service = new EventsService(
      mockEventRepository as any,
      mockUserRepository as any,
      mockS3Service as any,
      mockMailService as any
    );

    eventRepository = mockEventRepository;
    userRepository = mockUserRepository;
    s3Service = mockS3Service;
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
    it('should create a new event', async () => {
      const createEventDto: CreateEventDto = {
        name: 'Test Event',
        description: 'Test Description',
        date: '2025-12-15T09:00:00.000Z',
        location: 'Test Location',
      };

      const result = await service.create(createEventDto, 'organizer-id', mockFile as any);

      expect(userRepository.findById).toHaveBeenCalledWith('organizer-id');
      expect(eventRepository.findByName).toHaveBeenCalledWith('Test Event');
      expect(s3Service.uploadFile).toHaveBeenCalled();
      expect(eventRepository.create).toHaveBeenCalled();
      expect(mailService.sendEventCreatedEmail).toHaveBeenCalled();
      expect(result).toEqual(mockEvent);
    });

    it('should throw EntityNotFoundException when user is not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      const createEventDto: CreateEventDto = {
        name: 'Test Event',
        description: 'Test Description',
        date: '2025-12-15T09:00:00.000Z',
        location: 'Test Location',
      };

      await expect(
        service.create(createEventDto, 'nonexistent-id', mockFile as any),
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw AuthorizationException when user is not admin or organizer', async () => {
      userRepository.findById.mockResolvedValueOnce({
        ...mockUser,
        role: 'participant',
      });

      const createEventDto: CreateEventDto = {
        name: 'Test Event',
        description: 'Test Description',
        date: '2025-12-15T09:00:00.000Z',
        location: 'Test Location',
      };

      await expect(
        service.create(createEventDto, 'participant-id', mockFile as any),
      ).rejects.toThrow(AuthorizationException);
    });

    it('should throw ConflictException when event name already exists', async () => {
      eventRepository.findByName.mockResolvedValueOnce(mockEvent);

      const createEventDto: CreateEventDto = {
        name: 'Test Event',
        description: 'Test Description',
        date: '2025-12-15T09:00:00.000Z',
        location: 'Test Location',
      };

      await expect(
        service.create(createEventDto, 'organizer-id', mockFile as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ValidationException when image file is not provided', async () => {
      const createEventDto: CreateEventDto = {
        name: 'Test Event',
        description: 'Test Description',
        date: '2025-12-15T09:00:00.000Z',
        location: 'Test Location',
      };

      await expect(
        service.create(createEventDto, 'organizer-id', undefined as any),
      ).rejects.toThrow(ValidationException);
    });

    it('should handle errors when sending notifications to participants', async () => {
      jest.spyOn(service as any, 'findParticipants').mockResolvedValueOnce([{ email: 'participant@example.com' }]);
      mailService.sendNewEventNotificationToParticipants.mockRejectedValueOnce(new Error('Mail error'));

      const createEventDto: CreateEventDto = {
        name: 'Test Event',
        description: 'Test Description',
        date: '2025-12-15T09:00:00.000Z',
        location: 'Test Location',
      };

      await service.create(createEventDto, 'organizer-id', mockFile as any);

      expect(console.error).toHaveBeenCalled();
      expect(eventRepository.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return an array of events with pagination', async () => {
      const queryDto: QueryEventsDto = {
        page: 1,
        limit: 10,
      };

      const result = await service.findAll(queryDto);

      expect(eventRepository.findWithFilters).toHaveBeenCalledWith({
        name: undefined,
        startDate: undefined,
        endDate: undefined,
        active: undefined,
        page: 1,
        limit: 10,
      });
      expect(result).toEqual({ items: [mockEvent], total: 1 });
    });

    it('should use default pagination values when not provided', async () => {
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
    it('should return a single event', async () => {
      const result = await service.findById('test-id');

      expect(eventRepository.findById).toHaveBeenCalledWith('test-id');
      expect(result).toEqual(mockEvent);
    });

    it('should throw EntityNotFoundException when event is not found', async () => {
      eventRepository.findById.mockResolvedValueOnce(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('update', () => {
    it('should update an event', async () => {
      const updateEventDto: UpdateEventDto = {
        name: 'Updated Event',
        description: 'Updated Description',
      };

      const result = await service.update('test-id', updateEventDto, 'organizer-id', 'organizer', mockFile as any);

      expect(eventRepository.findById).toHaveBeenCalledWith('test-id');
      expect(eventRepository.findByName).toHaveBeenCalledWith('Updated Event');
      expect(s3Service.uploadFile).toHaveBeenCalled();
      expect(eventRepository.update).toHaveBeenCalled();
      expect(result).toEqual(mockEvent);
    });

    it('should throw EntityNotFoundException when event is not found', async () => {
      eventRepository.findById.mockResolvedValueOnce(null);

      const updateEventDto: UpdateEventDto = {
        name: 'Updated Event',
      };

      await expect(
        service.update('nonexistent-id', updateEventDto, 'organizer-id', 'organizer'),
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw AuthorizationException when user is not admin or event organizer', async () => {
      const updateEventDto: UpdateEventDto = {
        name: 'Updated Event',
      };

      await expect(
        service.update('test-id', updateEventDto, 'different-user-id', 'participant'),
      ).rejects.toThrow(AuthorizationException);
    });

    it('should allow admin to update any event', async () => {
      const updateEventDto: UpdateEventDto = {
        name: 'Updated Event',
      };

      await service.update('test-id', updateEventDto, 'admin-id', 'admin');

      expect(eventRepository.update).toHaveBeenCalled();
    });

    it('should throw ConflictException when updated name already exists for another event', async () => {
      eventRepository.findByName.mockResolvedValueOnce({
        ...mockEvent,
        id: 'different-id',
      });

      const updateEventDto: UpdateEventDto = {
        name: 'Updated Event',
      };

      await expect(
        service.update('test-id', updateEventDto, 'organizer-id', 'organizer'),
      ).rejects.toThrow(ConflictException);
    });

    it('should not upload new image when file is not provided', async () => {
      const updateEventDto: UpdateEventDto = {
        name: 'Updated Event',
      };

      await service.update('test-id', updateEventDto, 'organizer-id', 'organizer');

      expect(s3Service.uploadFile).not.toHaveBeenCalled();
      expect(eventRepository.update).toHaveBeenCalled();
    });

    it('should throw EntityNotFoundException when update fails', async () => {
      eventRepository.update.mockResolvedValueOnce(null);

      const updateEventDto: UpdateEventDto = {
        name: 'Updated Event',
      };

      await expect(
        service.update('test-id', updateEventDto, 'organizer-id', 'organizer'),
      ).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('delete', () => {
    it('should deactivate an event', async () => {
      const result = await service.delete('test-id', 'organizer-id', 'organizer');

      expect(eventRepository.findById).toHaveBeenCalledWith('test-id');
      expect(eventRepository.update).toHaveBeenCalledWith('test-id', {
        active: false,
        updatedAt: expect.any(String),
      });
      expect(userRepository.findById).toHaveBeenCalledWith('organizer-id');
      expect(mailService.sendEventDeletedEmail).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw EntityNotFoundException when event is not found', async () => {
      eventRepository.findById.mockResolvedValueOnce(null);

      await expect(
        service.delete('nonexistent-id', 'organizer-id', 'organizer'),
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw AuthorizationException when user is not admin or event organizer', async () => {
      await expect(
        service.delete('test-id', 'different-user-id', 'participant'),
      ).rejects.toThrow(AuthorizationException);
    });

    it('should allow admin to delete any event', async () => {
      await service.delete('test-id', 'admin-id', 'admin');

      expect(eventRepository.update).toHaveBeenCalled();
    });

    it('should handle case when organizer is not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      await service.delete('test-id', 'organizer-id', 'organizer');

      expect(mailService.sendEventDeletedEmail).not.toHaveBeenCalled();
      expect(eventRepository.update).toHaveBeenCalled();
    });
  });

  describe('findByDate', () => {
    it('should return events for a specific date', async () => {
      const result = await service.findByDate('2023-01-01');

      expect(eventRepository.findByDate).toHaveBeenCalledWith('2023-01-01');
      expect(result).toEqual([mockEvent]);
    });
  });
});