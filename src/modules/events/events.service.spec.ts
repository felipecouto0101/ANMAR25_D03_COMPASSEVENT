import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { EventRepository } from '../../domain/repositories/event.repository.interface';
import { RegistrationRepository } from '../../domain/repositories/registration.repository.interface';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { S3Service } from '../../infrastructure/storage/s3/s3.service';
import { MailService } from '../../infrastructure/mail/mail.service';
import { v4 as uuidv4 } from 'uuid';


jest.spyOn(console, 'error').mockImplementation(() => {});

jest.mock('uuid');
(uuidv4 as jest.Mock).mockReturnValue('mock-uuid');

describe('EventsService', () => {
  let service: EventsService;
  let eventRepository: EventRepository;
  let userRepository: UserRepository;
  let registrationRepository: RegistrationRepository;
  let s3Service: S3Service;
  let mailService: MailService;

  const mockEventRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };

  const mockUserRepository = {
    findById: jest.fn()
  };

  const mockRegistrationRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEventId: jest.fn(),
    findByUserId: jest.fn(),
    findByUserAndEvent: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };

  const mockS3Service = {
    uploadFile: jest.fn().mockResolvedValue('https://mock-url.com/image.jpg')
  };

  const mockMailService = {
    sendEventCreatedEmail: jest.fn().mockResolvedValue(undefined),
    sendNewEventNotificationToParticipants: jest.fn().mockResolvedValue(undefined),
    sendEventDeletedEmail: jest.fn().mockResolvedValue(undefined)
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: 'EventRepository', useValue: mockEventRepository },
        { provide: 'UserRepository', useValue: mockUserRepository },
        { provide: 'RegistrationRepository', useValue: mockRegistrationRepository },
        { provide: S3Service, useValue: mockS3Service },
        { provide: MailService, useValue: mockMailService }
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    eventRepository = module.get<EventRepository>('EventRepository');
    userRepository = module.get<UserRepository>('UserRepository');
    registrationRepository = module.get<RegistrationRepository>('RegistrationRepository');
    s3Service = module.get<S3Service>(S3Service);
    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an event', async () => {
      const createEventDto = {
        name: 'Test Event',
        description: 'Test Description',
        date: '2025-12-15T09:00:00.000Z',
        location: 'Test Location',
        capacity: 100,
        price: 10,
        isPublic: true,
        organizerId: 'organizer-id'
      };

      const mockFile = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test image content'),
        size: 123
      } as Express.Multer.File;

      const mockEvent = {
        id: 'event-id',
        ...createEventDto,
        imageUrl: 'https://mock-url.com/image.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findById.mockResolvedValue({ id: 'organizer-id', role: 'organizer' });
      mockEventRepository.findByName.mockResolvedValue(null);
      mockEventRepository.create.mockResolvedValue(mockEvent);
      mockRegistrationRepository.findByUserAndEvent.mockResolvedValue(null);
      mockRegistrationRepository.findByEventId.mockResolvedValue({ items: [] });

      const result = await service.create(createEventDto, 'organizer-id', mockFile);

      expect(s3Service.uploadFile).toHaveBeenCalled();
      expect(eventRepository.create).toHaveBeenCalledWith({
        id: expect.any(String),
        ...createEventDto,
        imageUrl: 'https://mock-url.com/image.jpg',
        active: true,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
      expect(result).toEqual(mockEvent);
    });

    it('should handle notification errors gracefully', async () => {
      const createEventDto = {
        name: 'Test Event',
        description: 'Test Description',
        date: '2025-12-15T09:00:00.000Z',
        location: 'Test Location',
        capacity: 100,
        price: 10,
        isPublic: true,
        organizerId: 'organizer-id'
      };

      const mockFile = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test image content'),
        size: 123
      } as Express.Multer.File;

      const mockEvent = {
        id: 'event-id',
        ...createEventDto,
        imageUrl: 'https://mock-url.com/image.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepository.findById.mockResolvedValue({ id: 'organizer-id', role: 'organizer' });
      mockEventRepository.findByName.mockResolvedValue(null);
      mockEventRepository.create.mockResolvedValue(mockEvent);
      mockRegistrationRepository.findByUserAndEvent.mockResolvedValue(null);
      mockRegistrationRepository.findByEventId.mockResolvedValue({ 
        items: [{ userId: 'user-id', eventId: 'event-id' }] 
      });
      mockMailService.sendNewEventNotificationToParticipants.mockRejectedValue(new Error('Failed to send'));

      const result = await service.create(createEventDto, 'organizer-id', mockFile);

      expect(mailService.sendNewEventNotificationToParticipants).toHaveBeenCalled();
      expect(result).toEqual(mockEvent);
    });
  });
});