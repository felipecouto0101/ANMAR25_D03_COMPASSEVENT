import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { User } from '../../domain/entities/user.entity';
import { Event } from '../../domain/entities/event.entity';
import { SESClient, SendEmailCommand, ListVerifiedEmailAddressesCommand } from '@aws-sdk/client-ses';


jest.mock('ical-generator', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      createEvent: jest.fn().mockReturnThis(),
      toString: jest.fn().mockReturnValue('test-ical')
    }))
  };
});

const mockSend = jest.fn();

class MockSESClient {
  send = mockSend;
}

jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn().mockImplementation(() => new MockSESClient()),
  SendEmailCommand: jest.fn(),
  ListVerifiedEmailAddressesCommand: jest.fn()
}));

describe('MailService', () => {
  let service: MailService;
  let mockConfigService: jest.Mocked<ConfigService>;

  const mockConfig = {
    'AWS_REGION': 'us-east-1',
    'AWS_ACCESS_KEY_ID': 'test-key',
    'AWS_SECRET_ACCESS_KEY': 'test-secret',
    'AWS_SESSION_TOKEN': 'test-token',
    'EMAIL_FROM': 'test@example.com',
    'FRONTEND_URL': 'https://example.com',
    'EMAIL_VERIFICATION_SECRET': 'test-secret',
    'EMAIL_VERIFICATION_EXPIRY': '24h'
  };

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
    jest.clearAllMocks();
    
    mockConfigService = {
      get: jest.fn((key: string) => mockConfig[key]),
    } as any;

    mockSend.mockResolvedValueOnce({
      VerifiedEmailAddresses: ['test@example.com', 'user2@example.com']
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with all credentials', async () => {
      jest.clearAllMocks();
      
      const module = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const newService = module.get<MailService>(MailService);
      expect(newService).toBeDefined();
      
     
      const isEnabled = (newService as any).isEnabled;
      expect(isEnabled).toBe(true);
    });

    it('should disable email service when credentials are missing', async () => {
      jest.clearAllMocks();
      
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'AWS_REGION') return undefined;
        return mockConfig[key];
      });
      
      const module = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const disabledService = module.get<MailService>(MailService);
      expect(disabledService).toBeDefined();
      
     
      const isEnabled = (disabledService as any).isEnabled;
      expect(isEnabled).toBe(false);
      
      const result = await disabledService.sendVerificationEmail(testUser);
      expect(result).toBe(false);
    });

    it('should disable email service when fromEmail is missing', async () => {
      jest.clearAllMocks();
      
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'EMAIL_FROM') return undefined;
        return mockConfig[key];
      });
      
      const module = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const disabledService = module.get<MailService>(MailService);
      
      
      const isEnabled = (disabledService as any).isEnabled;
      expect(isEnabled).toBe(false);
    });
  });

  describe('loadVerifiedEmails', () => {
    it('should load verified emails successfully', async () => {
      jest.clearAllMocks();
      
     
      mockSend.mockResolvedValueOnce({
        VerifiedEmailAddresses: ['test@example.com', 'admin@example.com']
      });
      
      const module = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const newService = module.get<MailService>(MailService);
      
      
      const verifiedEmails = (newService as any).verifiedEmails;
      expect(verifiedEmails.size).toBeGreaterThan(0);
      expect(verifiedEmails.has('test@example.com')).toBe(true);
    });

    it('should handle empty verified emails response', async () => {
      jest.clearAllMocks();
      
      
      mockSend.mockResolvedValueOnce({
        VerifiedEmailAddresses: []
      });
      
      const module = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const newService = module.get<MailService>(MailService);
      
     
      const verifiedEmails = (newService as any).verifiedEmails;
      expect(verifiedEmails.size).toBe(0);
    });

    it('should handle errors when loading verified emails', async () => {
      jest.clearAllMocks();
      
      mockSend.mockRejectedValueOnce(new Error('Failed to load emails'));
      
      const module = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const newService = module.get<MailService>(MailService);
      expect(newService).toBeDefined();
      
      
      const verifiedEmails = (newService as any).verifiedEmails;
      expect(verifiedEmails).toBeDefined();
    });

    it('should skip loading verified emails when service is disabled', async () => {
      jest.clearAllMocks();
      
      const disabledConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'AWS_REGION') return undefined;
          return mockConfig[key];
        }),
      } as any;
      
      const module = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: ConfigService,
            useValue: disabledConfigService,
          },
        ],
      }).compile();

      module.get<MailService>(MailService);
      
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('isEmailVerified', () => {
    it('should return true for verified email', async () => {
      jest.clearAllMocks();
      
      
      mockSend.mockResolvedValueOnce({
        VerifiedEmailAddresses: ['test@example.com', 'admin@example.com']
      });
      
      const module = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const newService = module.get<MailService>(MailService);
      
      
      const isVerified = (newService as any).isEmailVerified('test@example.com');
      expect(isVerified).toBe(true);
    });

    it('should return false for unverified email', async () => {
      jest.clearAllMocks();
      
      
      mockSend.mockResolvedValueOnce({
        VerifiedEmailAddresses: ['test@example.com', 'admin@example.com']
      });
      
      const module = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const newService = module.get<MailService>(MailService);
      
      
      const isVerified = (newService as any).isEmailVerified('unverified@example.com');
      expect(isVerified).toBe(false);
    });
  });

  describe('sendEmail', () => {
    it('should skip sending when service is disabled', async () => {
      jest.clearAllMocks();
      
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'AWS_REGION') return undefined;
        return mockConfig[key];
      });
      
      const module = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const disabledService = module.get<MailService>(MailService);
      
      
      const result = await (disabledService as any).sendEmail('test@example.com', 'Subject', 'Content');
      expect(result).toBe(false);
    });

    it('should skip sending when email is not verified', async () => {
      jest.clearAllMocks();
      
      
      mockSend.mockResolvedValueOnce({
        VerifiedEmailAddresses: ['verified@example.com']
      });
      
      const module = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const newService = module.get<MailService>(MailService);
      
      
      const result = await (newService as any).sendEmail('unverified@example.com', 'Subject', 'Content');
      expect(result).toBe(false);
    });

    it('should handle errors when sending email', async () => {
     
      mockSend.mockRejectedValueOnce(new Error('Failed to send email'));
      
      
      const result = await (service as any).sendEmail('test@example.com', 'Subject', 'Content');
      expect(result).toBe(false);
    });

    it('should handle attachments in email', async () => {
     
      mockSend.mockResolvedValueOnce({});
      
      
      const result = await (service as any).sendEmail(
        'test@example.com', 
        'Subject', 
        'Content', 
        [{filename: 'test.ics', content: 'test content'}]
      );
      expect(result).toBe(true);
    });

    it('should send email successfully', async () => {
     
      mockSend.mockResolvedValueOnce({});
      
      
      const result = await (service as any).sendEmail('test@example.com', 'Subject', 'Content');
      expect(result).toBe(true);
    });
  });

  describe('generateVerificationToken', () => {
    it('should generate a token with configured secret', () => {
      const token = service.generateVerificationToken('user-id', 'test@example.com');
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should generate a token with default secret when not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'EMAIL_VERIFICATION_SECRET') return undefined;
        return mockConfig[key];
      });
      
      const module = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();
      
      const newService = module.get<MailService>(MailService);
      const token = newService.generateVerificationToken('user-id', 'test@example.com');
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
  });

  describe('verifyEmailToken', () => {
    it('should verify a valid token', () => {
      const token = service.generateVerificationToken('user-id', 'test@example.com');
      const result = service.verifyEmailToken(token);
      
      expect(result).toBeDefined();
      expect(result?.userId).toBe('user-id');
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null for an invalid token', () => {
      const result = service.verifyEmailToken('invalid-token');
      expect(result).toBeNull();
    });
  });

  describe('sendVerificationEmail', () => {
    it('should skip sending when frontend URL is not configured', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'FRONTEND_URL') return undefined;
        return mockConfig[key];
      });
      
      const module = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();
      
      const newService = module.get<MailService>(MailService);
      const result = await newService.sendVerificationEmail(testUser);
      
      expect(result).toBe(false);
    });

    it('should send verification email successfully', async () => {
      jest.clearAllMocks();
      
      
      mockSend.mockResolvedValueOnce({});
      
      const result = await service.sendVerificationEmail(testUser);
      expect(result).toBe(true);
    });
  });

  describe('email sending methods', () => {
    beforeEach(() => {
      
      mockSend.mockResolvedValue({});
    });

    it('should send account deleted email', async () => {
      const result = await service.sendAccountDeletedEmail(testUser);
      expect(result).toBe(true);
    });

    it('should send event created email', async () => {
      const result = await service.sendEventCreatedEmail(testEvent, testUser);
      expect(result).toBe(true);
    });

    it('should send event deleted email', async () => {
      const result = await service.sendEventDeletedEmail(testEvent, testUser);
      expect(result).toBe(true);
    });

    it('should send registration confirmation email', async () => {
      const result = await service.sendRegistrationConfirmationEmail(testEvent, testUser);
      expect(result).toBe(true);
    });

    it('should send registration cancelled email', async () => {
      const result = await service.sendRegistrationCancelledEmail(testEvent, testUser);
      expect(result).toBe(true);
    });

    it('should send new event notification to participants', async () => {
      const participants = [testUser, {...testUser, id: 'user-id-2', email: 'user2@example.com'}];
      const result = await service.sendNewEventNotificationToParticipants(testEvent, participants);
      expect(result).toBe(2);
    });

    it('should handle failed email in notification batch', async () => {
      
      mockSend.mockResolvedValueOnce({});
      mockSend.mockRejectedValueOnce(new Error('Failed to send email'));
      
      const participants = [testUser, {...testUser, id: 'user-id-2', email: 'user2@example.com'}];
      const result = await service.sendNewEventNotificationToParticipants(testEvent, participants);
      expect(result).toBe(1);
    });

    it('should skip sending notifications when service is disabled', async () => {
      jest.clearAllMocks();
      
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'AWS_REGION') return undefined;
        return mockConfig[key];
      });
      
      const module = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const disabledService = module.get<MailService>(MailService);
      
      const participants = [testUser, {...testUser, id: 'user-id-2', email: 'user2@example.com'}];
      const result = await disabledService.sendNewEventNotificationToParticipants(testEvent, participants);
      expect(result).toBe(0);
    });
  });
});