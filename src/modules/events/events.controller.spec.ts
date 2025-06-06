import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { ConfigService } from '@nestjs/config';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { Event } from '../../domain/entities/event.entity';

describe('EventsController', () => {
  let controller: EventsController;
  let eventsService: EventsService;
  let userRepository: any;
  let configService: ConfigService;

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

  beforeEach(async () => {
    const mockEventsService = {
      create: jest.fn().mockResolvedValue(mockEvent),
      findAll: jest.fn().mockResolvedValue({ items: [mockEvent], total: 1 }),
      findById: jest.fn().mockResolvedValue(mockEvent),
      update: jest.fn().mockResolvedValue(mockEvent),
      delete: jest.fn().mockResolvedValue(true),
    };

    const mockUserRepository = {
      findByEmail: jest.fn().mockResolvedValue({ id: 'admin-id', role: 'admin' }),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('admin@example.com'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
        {
          provide: 'UserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    eventsService = module.get<EventsService>(EventsService);
    userRepository = module.get('UserRepository');
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new event', async () => {
      const createEventDto: CreateEventDto = {
        name: 'Test Event',
        description: 'Test Description',
        date: '2025-12-15T09:00:00.000Z',
        location: 'Test Location',
      };

      const req = {
        user: { id: 'organizer-id', role: 'organizer' },
      };

      const result = await controller.create(createEventDto, mockFile as any, req);

      expect(eventsService.create).toHaveBeenCalledWith(
        createEventDto,
        'organizer-id',
        mockFile,
      );
      expect(result).toEqual(mockEvent);
    });

    it('should use adminId when user is not provided in request', async () => {
      const createEventDto: CreateEventDto = {
        name: 'Test Event',
        description: 'Test Description',
        date: '2025-12-15T09:00:00.000Z',
        location: 'Test Location',
      };

      const req = {};

      await controller.create(createEventDto, mockFile as any, req);

      expect(eventsService.create).toHaveBeenCalledWith(
        createEventDto,
        'admin-id',
        mockFile,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of events', async () => {
      const queryDto: QueryEventsDto = {
        page: 1,
        limit: 10,
      };

      const result = await controller.findAll(queryDto);

      expect(eventsService.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual({ items: [mockEvent], total: 1 });
    });
  });

  describe('findOne', () => {
    it('should return a single event', async () => {
      const result = await controller.findOne('test-id');

      expect(eventsService.findById).toHaveBeenCalledWith('test-id');
      expect(result).toEqual(mockEvent);
    });
  });

  describe('update', () => {
    it('should update an event', async () => {
      const updateEventDto: UpdateEventDto = {
        name: 'Updated Event',
        description: 'Updated Description',
      };

      const req = {
        user: { id: 'organizer-id', role: 'organizer' },
      };

      const result = await controller.update('test-id', updateEventDto, mockFile as any, req);

      expect(eventsService.update).toHaveBeenCalledWith(
        'test-id',
        updateEventDto,
        'organizer-id',
        'organizer',
        mockFile,
      );
      expect(result).toEqual(mockEvent);
    });

    it('should use adminId and role when user is not provided in request', async () => {
      const updateEventDto: UpdateEventDto = {
        name: 'Updated Event',
      };

      const req = {};

      await controller.update('test-id', updateEventDto, mockFile as any, req);

      expect(eventsService.update).toHaveBeenCalledWith(
        'test-id',
        updateEventDto,
        'admin-id',
        'admin',
        mockFile,
      );
    });
  });

  describe('remove', () => {
    it('should remove an event', async () => {
      const req = {
        user: { id: 'organizer-id', role: 'organizer' },
      };

      const result = await controller.remove('test-id', req);

      expect(eventsService.delete).toHaveBeenCalledWith('test-id', 'organizer-id', 'organizer');
      expect(result).toBe(true);
    });

    it('should use adminId and role when user is not provided in request', async () => {
      const req = {};

      await controller.remove('test-id', req);

      expect(eventsService.delete).toHaveBeenCalledWith('test-id', 'admin-id', 'admin');
    });
  });

  describe('initAdminId', () => {
    it('should initialize adminId from config and repository', async () => {
      expect(configService.get).toHaveBeenCalledWith('DEFAULT_ADMIN_EMAIL');
      expect(userRepository.findByEmail).toHaveBeenCalledWith('admin@example.com');
      expect(controller['adminId']).toBe('admin-id');
    });

    it('should handle errors during initialization', async () => {
     
      jest.spyOn(configService, 'get').mockImplementation((key) => {
        if (key === 'NODE_ENV') return 'production';
        if (key === 'DEFAULT_ADMIN_EMAIL') return 'admin@example.com';
        return null;
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      userRepository.findByEmail.mockRejectedValueOnce(new Error('Database error'));
      
     
      controller['adminId'] = null;
      
      await controller['initAdminId']();
      
      
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('should not set adminId if admin email is not found', async () => {
      userRepository.findByEmail.mockResolvedValueOnce(null);
      controller['adminId'] = null;
      
      await controller['initAdminId']();
      
      expect(controller['adminId']).toBeNull();
    });

    it('should set test admin ID if admin email is not configured in test environment', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key) => {
        if (key === 'NODE_ENV') return 'test';
        if (key === 'DEFAULT_ADMIN_EMAIL') return undefined;
        return null;
      });
      controller['adminId'] = null;
      
      await controller['initAdminId']();
      
    
      expect(controller['adminId']).toBe('test-admin-id');
    });
  });
});