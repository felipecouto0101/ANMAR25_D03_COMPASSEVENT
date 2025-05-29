// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { SESClient, SendEmailCommand, ListVerifiedEmailAddressesCommand } from '@aws-sdk/client-ses';
import { Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { User } from '../../domain/entities/user.entity';
import { Event } from '../../domain/entities/event.entity';

jest.mock('@aws-sdk/client-ses');
jest.mock('ical-generator', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    createEvent: jest.fn().mockReturnThis(),
    toString: jest.fn().mockReturnValue('mock-ical-content'),
  })),
}));

describe('MailService', () => {
  let service: MailService;
  let configService: ConfigService;
  let mockSesClient: any;

  const mockUser = {
    id: 'user-id',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword123',
    phone: '+1234567890',
    role: 'participant',
    profileImageUrl: undefined,
    emailVerified: false,
    active: true,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  const mockEvent = {
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

  beforeEach(async () => {
    mockSesClient = {
      send: jest.fn(),
    };

    (SESClient as jest.Mock).mockImplementation(() => mockSesClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              const config = {
                AWS_REGION: 'us-east-1',
                AWS_ACCESS_KEY_ID: 'test-key',
                AWS_SECRET_ACCESS_KEY: 'test-secret',
                AWS_SESSION_TOKEN: 'test-token',
                EMAIL_FROM: 'noreply@example.com',
                FRONTEND_URL: 'https://example.com',
                EMAIL_VERIFICATION_SECRET: 'test-secret',
                EMAIL_VERIFICATION_EXPIRY: '24h',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);

    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    service['verifiedEmails'] = new Set(['test@example.com']);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with AWS credentials', () => {
      expect(SESClient).toHaveBeenCalledWith({
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
          sessionToken: 'test-token',
        },
      });
      expect(service['isEnabled']).toBe(true);
    });

    it('should disable email service when credentials are missing', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: ConfigService,
            useValue: configService,
          },
        ],
      }).compile();

      const disabledService = module.get<MailService>(MailService);
      expect(disabledService['isEnabled']).toBe(false);
    });
  });

  describe('loadVerifiedEmails', () => {
    it('should load verified emails from SES', async () => {
      mockSesClient.send.mockResolvedValueOnce({
        VerifiedEmailAddresses: ['test@example.com', 'another@example.com'],
      });

      await service['loadVerifiedEmails']();
      expect(ListVerifiedEmailAddressesCommand).toHaveBeenCalled();
      expect(service['verifiedEmails'].size).toBe(2);
      expect(service['verifiedEmails'].has('test@example.com')).toBe(true);
      expect(service['verifiedEmails'].has('another@example.com')).toBe(true);
    });

    it('should handle errors when loading verified emails', async () => {
      mockSesClient.send.mockRejectedValueOnce(new Error('Failed to load'));
      await service['loadVerifiedEmails']();
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('isEmailVerified', () => {
    it('should return true for verified email', () => {
      service['verifiedEmails'] = new Set(['test@example.com']);
      expect(service['isEmailVerified']('test@example.com')).toBe(true);
    });

    it('should return false for unverified email', () => {
      service['verifiedEmails'] = new Set(['test@example.com']);
      expect(service['isEmailVerified']('unverified@example.com')).toBe(false);
    });
  });

  describe('sendEmail', () => {
    it('should send email to verified address', async () => {
      mockSesClient.send.mockResolvedValueOnce({});
      const result = await service['sendEmail'](
        'test@example.com',
        'Test Subject',
        '<p>Test Content</p>'
      );
      expect(SendEmailCommand).toHaveBeenCalledWith({
        Source: 'noreply@example.com',
        Destination: {
          ToAddresses: ['test@example.com'],
        },
        Message: {
          Subject: {
            Data: 'Test Subject',
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: '<p>Test Content</p>',
              Charset: 'UTF-8',
            },
          },
        },
      });
      expect(result).toBe(true);
    });

    it('should not send email when service is disabled', async () => {
    
      mockSesClient.send.mockReset();
      
      Object.defineProperty(service, 'isEnabled', { value: false });
      const result = await service['sendEmail'](
        'test@example.com',
        'Test Subject',
        '<p>Test Content</p>'
      );
      expect(mockSesClient.send).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should not send email to unverified address', async () => {
     
      mockSesClient.send.mockReset();
      
      service['verifiedEmails'] = new Set(['verified@example.com']);
      const result = await service['sendEmail'](
        'unverified@example.com',
        'Test Subject',
        '<p>Test Content</p>'
      );
      expect(mockSesClient.send).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should handle errors when sending email', async () => {
      mockSesClient.send.mockRejectedValueOnce(new Error('Failed to send'));
      const result = await service['sendEmail'](
        'test@example.com',
        'Test Subject',
        '<p>Test Content</p>'
      );
      expect(result).toBe(false);
    });
  });

  describe('generateVerificationToken', () => {
    it('should generate token with configured secret', () => {
      jest.spyOn(jwt, 'sign').mockImplementation(() => 'test-token');
      const token = service.generateVerificationToken('user-id', 'test@example.com');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-id', email: 'test@example.com' },
        'test-secret',
        { expiresIn: '24h' }
      );
      expect(token).toBe('test-token');
    });

    it('should use default secret when not configured', () => {
      Object.defineProperty(service, 'verificationSecret', { value: undefined });
      jest.spyOn(jwt, 'sign').mockImplementation(() => 'test-token');
      const token = service.generateVerificationToken('user-id', 'test@example.com');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-id', email: 'test@example.com' },
        'insecure-default-secret',
        { expiresIn: '24h' }
      );
    });
  });

  describe('verifyEmailToken', () => {
    it('should verify valid token', () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => ({ userId: 'user-id', email: 'test@example.com' }));
      const result = service.verifyEmailToken('valid-token');
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(result).toEqual({ userId: 'user-id', email: 'test@example.com' });
    });

    it('should return null for invalid token', () => {
      jest.spyOn(jwt, 'verify').mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });
      const result = service.verifyEmailToken('invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email', async () => {
      jest.spyOn(service, 'generateVerificationToken').mockImplementation(() => 'test-token');
      jest.spyOn(service as any, 'sendEmail').mockResolvedValueOnce(true);

      const result = await service.sendVerificationEmail(mockUser);
      expect(service.generateVerificationToken).toHaveBeenCalledWith('user-id', 'test@example.com');
      expect(service['sendEmail']).toHaveBeenCalledWith(
        'test@example.com',
        'Verify Your Email',
        expect.stringContaining('https://example.com/users/verify-email?token=test-token')
      );
      expect(result).toBe(true);
    });

    it('should not send email when frontend URL is not configured', async () => {
      Object.defineProperty(service, 'frontendUrl', { value: undefined });
      const result = await service.sendVerificationEmail(mockUser);
      expect(result).toBe(false);
    });
  });

  describe('sendAccountDeletedEmail', () => {
    it('should send account deleted email', async () => {
      jest.spyOn(service as any, 'sendEmail').mockResolvedValueOnce(true);
      const result = await service.sendAccountDeletedEmail(mockUser);
      expect(service['sendEmail']).toHaveBeenCalledWith(
        'test@example.com',
        'Account Deleted',
        expect.stringContaining('Account Deleted')
      );
      expect(result).toBe(true);
    });
  });

  describe('sendEventCreatedEmail', () => {
    it('should send event created email', async () => {
      jest.spyOn(service as any, 'sendEmail').mockResolvedValueOnce(true);
      const result = await service.sendEventCreatedEmail(mockEvent, mockUser);
      expect(service['sendEmail']).toHaveBeenCalledWith(
        'test@example.com',
        'Event Created Successfully',
        expect.stringContaining('New Event Created')
      );
      expect(result).toBe(true);
    });
  });

  describe('sendEventDeletedEmail', () => {
    it('should send event deleted email', async () => {
      jest.spyOn(service as any, 'sendEmail').mockResolvedValueOnce(true);
      const result = await service.sendEventDeletedEmail(mockEvent, mockUser);
      expect(service['sendEmail']).toHaveBeenCalledWith(
        'test@example.com',
        'Event Deleted',
        expect.stringContaining('Event Deleted')
      );
      expect(result).toBe(true);
    });
  });

  describe('sendRegistrationConfirmationEmail', () => {
    it('should send registration confirmation email', async () => {
      jest.spyOn(service as any, 'sendEmail').mockResolvedValueOnce(true);
      const result = await service.sendRegistrationConfirmationEmail(mockEvent, mockUser);
      expect(service['sendEmail']).toHaveBeenCalledWith(
        'test@example.com',
        'Registration Confirmed: Test Event',
        expect.stringContaining('Registration Confirmed')
      );
      expect(result).toBe(true);
    });
  });

  describe('sendRegistrationCancelledEmail', () => {
    it('should send registration cancelled email', async () => {
      jest.spyOn(service as any, 'sendEmail').mockResolvedValueOnce(true);
      const result = await service.sendRegistrationCancelledEmail(mockEvent, mockUser);
      expect(service['sendEmail']).toHaveBeenCalledWith(
        'test@example.com',
        'Registration Cancelled: Test Event',
        expect.stringContaining('Registration Cancelled')
      );
      expect(result).toBe(true);
    });
  });

  describe('sendNewEventNotificationToParticipants', () => {
    it('should send notifications to multiple participants', async () => {
      jest.spyOn(service as any, 'sendEmail')
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const participants = [
        { ...mockUser, email: 'user1@example.com' },
        { ...mockUser, email: 'user2@example.com' },
        { ...mockUser, email: 'user3@example.com' },
      ];

      const result = await service.sendNewEventNotificationToParticipants(mockEvent, participants);
      expect(service['sendEmail']).toHaveBeenCalledTimes(3);
      expect(result).toBe(2); 
    });

    it('should return 0 when service is disabled', async () => {
      Object.defineProperty(service, 'isEnabled', { value: false });
      const result = await service.sendNewEventNotificationToParticipants(mockEvent, [mockUser]);
      expect(result).toBe(0);
    });
  });
});