import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { NotificationService } from './notification.service';
import { Event } from '../../domain/entities/event.entity';
import { User } from '../../domain/entities/user.entity';
import { TOKEN_SERVICE } from './constants/injection-tokens';

describe('MailService', () => {
  let service: MailService;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockTokenService: any;

  const testUser: User = {
    id: 'user-id',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed-password',
    role: 'admin',
    phone: '123456789',
    active: true,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    emailVerified: false
  };

  const testEvent: Event = {
    id: 'event-id',
    name: 'Test Event',
    description: 'Test Description',
    date: new Date().toISOString(),
    location: 'Test Location',
    imageUrl: 'https://example.com/image.jpg',
    organizerId: 'user-id',
    active: true,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  };

  beforeEach(async () => {
    
    mockTokenService = {
      generateToken: jest.fn().mockReturnValue('test-token'),
      verifyToken: jest.fn().mockReturnValue({ userId: 'user-id', email: 'test@example.com' })
    };

   
    mockNotificationService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(true),
      sendAccountDeletedEmail: jest.fn().mockResolvedValue(true),
      sendEventCreatedEmail: jest.fn().mockResolvedValue(true),
      sendEventDeletedEmail: jest.fn().mockResolvedValue(true),
      sendRegistrationConfirmationEmail: jest.fn().mockResolvedValue(true),
      sendRegistrationCancelledEmail: jest.fn().mockResolvedValue(true),
      sendNewEventNotificationToParticipants: jest.fn().mockResolvedValue(2)
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: TOKEN_SERVICE, useValue: mockTokenService }
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should inject dependencies correctly', () => {
      expect(service['notificationService']).toBe(mockNotificationService);
      expect(service['tokenService']).toBe(mockTokenService);
    });
  });

  describe('generateVerificationToken', () => {
    it('should generate a token', () => {
      const token = service.generateVerificationToken('user-id', 'test@example.com');
      
      expect(mockTokenService.generateToken).toHaveBeenCalledWith('user-id', 'test@example.com');
      expect(token).toBe('test-token');
    });
  });

  describe('verifyEmailToken', () => {
    it('should verify a token', () => {
      const result = service.verifyEmailToken('test-token');
      
      expect(mockTokenService.verifyToken).toHaveBeenCalledWith('test-token');
      expect(result).toEqual({ userId: 'user-id', email: 'test@example.com' });
    });

    it('should return null for invalid token', () => {
      mockTokenService.verifyToken.mockReturnValueOnce(null);
      
      const result = service.verifyEmailToken('invalid-token');
      
      expect(mockTokenService.verifyToken).toHaveBeenCalledWith('invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('sendVerificationEmail', () => {
    it('should delegate to notificationService', async () => {
      const result = await service.sendVerificationEmail(testUser);
      
      expect(mockNotificationService.sendVerificationEmail).toHaveBeenCalledWith(testUser);
      expect(result).toBe(true);
    });
  });

  describe('sendAccountDeletedEmail', () => {
    it('should delegate to notificationService', async () => {
      const result = await service.sendAccountDeletedEmail(testUser);
      
      expect(mockNotificationService.sendAccountDeletedEmail).toHaveBeenCalledWith(testUser);
      expect(result).toBe(true);
    });
  });

  describe('sendEventCreatedEmail', () => {
    it('should delegate to notificationService', async () => {
      const result = await service.sendEventCreatedEmail(testEvent, testUser);
      
      expect(mockNotificationService.sendEventCreatedEmail).toHaveBeenCalledWith(testEvent, testUser);
      expect(result).toBe(true);
    });
  });

  describe('sendEventDeletedEmail', () => {
    it('should delegate to notificationService', async () => {
      const result = await service.sendEventDeletedEmail(testEvent, testUser);
      
      expect(mockNotificationService.sendEventDeletedEmail).toHaveBeenCalledWith(testEvent, testUser);
      expect(result).toBe(true);
    });
  });

  describe('sendRegistrationConfirmationEmail', () => {
    it('should delegate to notificationService', async () => {
      const result = await service.sendRegistrationConfirmationEmail(testEvent, testUser);
      
      expect(mockNotificationService.sendRegistrationConfirmationEmail).toHaveBeenCalledWith(testEvent, testUser);
      expect(result).toBe(true);
    });
  });

  describe('sendRegistrationCancelledEmail', () => {
    it('should delegate to notificationService', async () => {
      const result = await service.sendRegistrationCancelledEmail(testEvent, testUser);
      
      expect(mockNotificationService.sendRegistrationCancelledEmail).toHaveBeenCalledWith(testEvent, testUser);
      expect(result).toBe(true);
    });
  });

  describe('sendNewEventNotificationToParticipants', () => {
    it('should delegate to notificationService', async () => {
      const participants = [testUser, {...testUser, id: 'user-id-2', email: 'user2@example.com'}];
      
      const result = await service.sendNewEventNotificationToParticipants(testEvent, participants);
      
      expect(mockNotificationService.sendNewEventNotificationToParticipants).toHaveBeenCalledWith(testEvent, participants);
      expect(result).toBe(2);
    });
  });
});