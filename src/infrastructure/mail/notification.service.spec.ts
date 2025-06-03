import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EMAIL_SENDER, CALENDAR_SERVICE, TOKEN_SERVICE, EMAIL_TEMPLATE } from './constants/injection-tokens';
import { EmailSender } from './interfaces/email-sender.interface';
import { CalendarService } from './interfaces/calendar-service.interface';
import { TokenService } from './interfaces/token-service.interface';
import { EmailTemplate } from './interfaces/email-template.interface';
import { User } from '../../domain/entities/user.entity';
import { Event } from '../../domain/entities/event.entity';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockEmailSender: jest.Mocked<EmailSender>;
  let mockCalendarService: jest.Mocked<CalendarService>;
  let mockTokenService: jest.Mocked<TokenService>;
  let mockEmailTemplate: jest.Mocked<EmailTemplate>;
  let mockConfigService: jest.Mocked<ConfigService>;

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

  const mockCalendarAttachment = {
    filename: 'test_event.ics',
    content: 'test-ical-content',
    contentType: 'text/calendar'
  };

  beforeEach(async () => {
    
    mockEmailSender = {
      sendEmail: jest.fn().mockResolvedValue(true)
    };

    mockCalendarService = {
      generateEventCalendar: jest.fn().mockReturnValue(mockCalendarAttachment)
    };

    mockTokenService = {
      generateToken: jest.fn().mockReturnValue('test-token'),
      verifyToken: jest.fn().mockReturnValue({ userId: 'user-id', email: 'test@example.com' })
    };

    mockEmailTemplate = {
      generateVerificationEmailTemplate: jest.fn().mockReturnValue('verification-html'),
      generateAccountDeletedEmailTemplate: jest.fn().mockReturnValue('account-deleted-html'),
      generateEventCreatedEmailTemplate: jest.fn().mockReturnValue('event-created-html'),
      generateEventDeletedEmailTemplate: jest.fn().mockReturnValue('event-deleted-html'),
      generateRegistrationConfirmationEmailTemplate: jest.fn().mockReturnValue('registration-confirmation-html'),
      generateRegistrationCancelledEmailTemplate: jest.fn().mockReturnValue('registration-cancelled-html'),
      generateNewEventNotificationEmailTemplate: jest.fn().mockReturnValue('new-event-notification-html')
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'FRONTEND_URL') return 'https://example.com';
        return undefined;
      })
    } as any;

    
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: EMAIL_SENDER, useValue: mockEmailSender },
        { provide: CALENDAR_SERVICE, useValue: mockCalendarService },
        { provide: TOKEN_SERVICE, useValue: mockTokenService },
        { provide: EMAIL_TEMPLATE, useValue: mockEmailTemplate },
        { provide: ConfigService, useValue: mockConfigService }
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      const result = await service.sendVerificationEmail(testUser);
      
      expect(mockTokenService.generateToken).toHaveBeenCalledWith(testUser.id, testUser.email);
      expect(mockEmailTemplate.generateVerificationEmailTemplate).toHaveBeenCalledWith(
        testUser, 
        'https://example.com/users/verify-email?token=test-token'
      );
      expect(mockEmailSender.sendEmail).toHaveBeenCalledWith(
        testUser.email, 
        'Verify Your Email', 
        'verification-html'
      );
      expect(result).toBe(true);
    });

    it('should skip sending when frontend URL is not configured', async () => {
      
      const noUrlConfigService = {
        get: jest.fn().mockReturnValue(undefined)
      } as any;
      
      const moduleWithoutUrl = await Test.createTestingModule({
        providers: [
          NotificationService,
          { provide: EMAIL_SENDER, useValue: mockEmailSender },
          { provide: CALENDAR_SERVICE, useValue: mockCalendarService },
          { provide: TOKEN_SERVICE, useValue: mockTokenService },
          { provide: EMAIL_TEMPLATE, useValue: mockEmailTemplate },
          { provide: ConfigService, useValue: noUrlConfigService }
        ],
      }).compile();
      
      const serviceWithoutUrl = moduleWithoutUrl.get<NotificationService>(NotificationService);
      
     
      jest.clearAllMocks();
      
      const result = await serviceWithoutUrl.sendVerificationEmail(testUser);
      
      expect(mockTokenService.generateToken).not.toHaveBeenCalled();
      expect(mockEmailTemplate.generateVerificationEmailTemplate).not.toHaveBeenCalled();
      expect(mockEmailSender.sendEmail).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('sendAccountDeletedEmail', () => {
    it('should send account deleted email successfully', async () => {
      const result = await service.sendAccountDeletedEmail(testUser);
      
      expect(mockEmailTemplate.generateAccountDeletedEmailTemplate).toHaveBeenCalledWith(testUser);
      expect(mockEmailSender.sendEmail).toHaveBeenCalledWith(
        testUser.email, 
        'Account Deleted', 
        'account-deleted-html'
      );
      expect(result).toBe(true);
    });
  });

  describe('sendEventCreatedEmail', () => {
    it('should send event created email with calendar attachment', async () => {
      const result = await service.sendEventCreatedEmail(testEvent, testUser);
      
      expect(mockEmailTemplate.generateEventCreatedEmailTemplate).toHaveBeenCalledWith(testEvent, testUser);
      expect(mockCalendarService.generateEventCalendar).toHaveBeenCalledWith(testEvent, testUser);
      expect(mockEmailSender.sendEmail).toHaveBeenCalledWith(
        testUser.email, 
        'Event Created Successfully', 
        'event-created-html',
        [mockCalendarAttachment]
      );
      expect(result).toBe(true);
    });
  });

  describe('sendEventDeletedEmail', () => {
    it('should send event deleted email', async () => {
      const result = await service.sendEventDeletedEmail(testEvent, testUser);
      
      expect(mockEmailTemplate.generateEventDeletedEmailTemplate).toHaveBeenCalledWith(testEvent, testUser);
      expect(mockEmailSender.sendEmail).toHaveBeenCalledWith(
        testUser.email, 
        'Event Deleted', 
        'event-deleted-html'
      );
      expect(result).toBe(true);
    });
  });

  describe('sendRegistrationConfirmationEmail', () => {
    it('should send registration confirmation email with calendar attachment', async () => {
      const result = await service.sendRegistrationConfirmationEmail(testEvent, testUser);
      
      expect(mockEmailTemplate.generateRegistrationConfirmationEmailTemplate).toHaveBeenCalledWith(testEvent, testUser);
      expect(mockCalendarService.generateEventCalendar).toHaveBeenCalledWith(testEvent);
      expect(mockEmailSender.sendEmail).toHaveBeenCalledWith(
        testUser.email, 
        `Registration Confirmed: ${testEvent.name}`, 
        'registration-confirmation-html',
        [mockCalendarAttachment]
      );
      expect(result).toBe(true);
    });
  });

  describe('sendRegistrationCancelledEmail', () => {
    it('should send registration cancelled email', async () => {
      const result = await service.sendRegistrationCancelledEmail(testEvent, testUser);
      
      expect(mockEmailTemplate.generateRegistrationCancelledEmailTemplate).toHaveBeenCalledWith(testEvent, testUser);
      expect(mockEmailSender.sendEmail).toHaveBeenCalledWith(
        testUser.email, 
        `Registration Cancelled: ${testEvent.name}`, 
        'registration-cancelled-html'
      );
      expect(result).toBe(true);
    });
  });

  describe('sendNewEventNotificationToParticipants', () => {
    it('should send notifications to all participants', async () => {
      const participants = [
        testUser,
        { ...testUser, id: 'user-id-2', email: 'user2@example.com' }
      ];
      
      const result = await service.sendNewEventNotificationToParticipants(testEvent, participants);
      
      expect(mockCalendarService.generateEventCalendar).toHaveBeenCalledWith(testEvent);
      expect(mockEmailTemplate.generateNewEventNotificationEmailTemplate).toHaveBeenCalledTimes(2);
      expect(mockEmailSender.sendEmail).toHaveBeenCalledTimes(2);
      expect(result).toBe(2);
    });

    it('should handle failed emails', async () => {
      const participants = [
        testUser,
        { ...testUser, id: 'user-id-2', email: 'user2@example.com' }
      ];
      
      mockEmailSender.sendEmail
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      
      const result = await service.sendNewEventNotificationToParticipants(testEvent, participants);
      
      expect(mockEmailSender.sendEmail).toHaveBeenCalledTimes(2);
      expect(result).toBe(1);
    });

    it('should handle empty participants list', async () => {
      const result = await service.sendNewEventNotificationToParticipants(testEvent, []);
      
      expect(mockCalendarService.generateEventCalendar).toHaveBeenCalledWith(testEvent);
      expect(mockEmailTemplate.generateNewEventNotificationEmailTemplate).not.toHaveBeenCalled();
      expect(mockEmailSender.sendEmail).not.toHaveBeenCalled();
      expect(result).toBe(0);
    });
  });
});