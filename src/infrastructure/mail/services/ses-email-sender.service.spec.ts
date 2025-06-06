import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { SESClient, SendEmailCommand, ListVerifiedEmailAddressesCommand, SendRawEmailCommand } from '@aws-sdk/client-ses';
import { SesEmailSender } from './ses-email-sender.service';


const mockSend = jest.fn();
jest.mock('@aws-sdk/client-ses', () => {
  const original = jest.requireActual('@aws-sdk/client-ses');
  return {
    ...original,
    SESClient: jest.fn().mockImplementation(() => ({
      send: mockSend
    })),
    SendEmailCommand: jest.fn(),
    SendRawEmailCommand: jest.fn(),
    ListVerifiedEmailAddressesCommand: jest.fn()
  };
});

describe('SesEmailSender', () => {
  let service: SesEmailSender;
  let mockConfigService: jest.Mocked<ConfigService>;

  const mockConfig = {
    'AWS_REGION': 'us-east-1',
    'AWS_ACCESS_KEY_ID': 'test-key',
    'AWS_SECRET_ACCESS_KEY': 'test-secret',
    'AWS_SESSION_TOKEN': 'test-token',
    'EMAIL_FROM': 'test@example.com'
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
   
    mockConfigService = {
      get: jest.fn((key: string) => mockConfig[key])
    } as any;

   
    mockSend.mockResolvedValueOnce({
      VerifiedEmailAddresses: ['test@example.com', 'verified@example.com']
    });

   
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SesEmailSender,
        { provide: ConfigService, useValue: mockConfigService }
      ],
    }).compile();

    service = module.get<SesEmailSender>(SesEmailSender);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with all credentials', () => {
      expect(SESClient).toHaveBeenCalledWith({
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
          sessionToken: 'test-token',
        },
      });
    });

    it('should disable email service when credentials are missing', async () => {
      jest.clearAllMocks();
      
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'AWS_REGION') return undefined;
        return mockConfig[key];
      });
      
      const module = await Test.createTestingModule({
        providers: [
          SesEmailSender,
          { provide: ConfigService, useValue: mockConfigService }
        ],
      }).compile();

      const disabledService = module.get<SesEmailSender>(SesEmailSender);
      
      
      const isEnabled = (disabledService as any).isEnabled;
      expect(isEnabled).toBe(false);
    });
  });

  describe('loadVerifiedEmails', () => {
    it('should handle empty VerifiedEmailAddresses', async () => {
      jest.clearAllMocks();
      
      const module = await Test.createTestingModule({
        providers: [
          SesEmailSender,
          { provide: ConfigService, useValue: mockConfigService }
        ],
      }).compile();
      
      const newService = module.get<SesEmailSender>(SesEmailSender);
      
      mockSend.mockResolvedValueOnce({});
      
      await (newService as any).loadVerifiedEmails();
      
      expect(mockSend).toHaveBeenCalled();
      expect(ListVerifiedEmailAddressesCommand).toHaveBeenCalled();
      
      expect((newService as any).verifiedEmails.size).toBe(0);
    });

    it('should skip loading emails when service is disabled', async () => {
      jest.clearAllMocks();
      
      
      const incompleteConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'AWS_REGION') return undefined;
          return mockConfig[key];
        })
      } as any;
      
      const module = await Test.createTestingModule({
        providers: [
          SesEmailSender,
          { provide: ConfigService, useValue: incompleteConfigService }
        ],
      }).compile();
      
      const newService = module.get<SesEmailSender>(SesEmailSender);
      
     
      expect((newService as any).isEnabled).toBe(false);
      
      await (newService as any).loadVerifiedEmails();
      
      
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('sendEmail', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'test';
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    it('should send email without attachments', async () => {
      mockSend.mockResolvedValueOnce({});
      
      const result = await service.sendEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test Content</p>'
      );
      
      expect(SendEmailCommand).toHaveBeenCalled();
      expect(SendRawEmailCommand).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should send email with attachments', async () => {
      mockSend.mockResolvedValueOnce({});
      
      const result = await service.sendEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test Content</p>',
        [{
          filename: 'test.ics',
          content: 'test-content',
          contentType: 'text/calendar'
        }]
      );
      
      expect(SendRawEmailCommand).toHaveBeenCalled();
      expect(SendEmailCommand).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle empty attachments array', async () => {
      mockSend.mockResolvedValueOnce({});
      
      const result = await service.sendEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test Content</p>',
        [] 
      );
      
      expect(SendEmailCommand).toHaveBeenCalled();
      expect(SendRawEmailCommand).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle undefined attachments', async () => {
      mockSend.mockResolvedValueOnce({});
      
      const result = await service.sendEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test Content</p>',
        undefined 
      );
      
      expect(SendEmailCommand).toHaveBeenCalled();
      expect(SendRawEmailCommand).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should skip sending when service is disabled', async () => {
      Object.defineProperty(service, 'isEnabled', { get: () => false });
      
      const result = await service.sendEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test Content</p>'
      );
      
      expect(SendEmailCommand).not.toHaveBeenCalled();
      expect(SendRawEmailCommand).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
    
    it('should skip sending when email is not verified', async () => {
  
      process.env.NODE_ENV = 'production';
      
      
      jest.spyOn(service as any, 'isEmailVerified').mockReturnValueOnce(false);
      
      const result = await service.sendEmail(
        'unverified@example.com',
        'Test Subject',
        '<p>Test Content</p>'
      );
      
      expect(SendEmailCommand).not.toHaveBeenCalled();
      expect(SendRawEmailCommand).not.toHaveBeenCalled();
      expect(result).toBe(false);
      
     
      process.env.NODE_ENV = 'test';
    });

    it('should handle errors when sending email', async () => {
      mockSend.mockRejectedValueOnce(new Error('Failed to send email'));
      
      const result = await service.sendEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test Content</p>'
      );
      
      expect(result).toBe(false);
    });
  });

  describe('isEmailVerified', () => {
    it('should return true in test environment', () => {
      process.env.NODE_ENV = 'test';
      
      const result = (service as any).isEmailVerified('any@example.com');
      
      expect(result).toBe(true);
      
      delete process.env.NODE_ENV;
    });

    it('should check verified emails in production environment', () => {
      process.env.NODE_ENV = 'production';
      
      const result1 = (service as any).isEmailVerified('verified@example.com');
      const result2 = (service as any).isEmailVerified('unverified@example.com');
      
      expect(result1).toBe(true);
      expect(result2).toBe(false);
      
      delete process.env.NODE_ENV;
    });
  });
});