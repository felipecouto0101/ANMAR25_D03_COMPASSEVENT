import { Test, TestingModule } from '@nestjs/testing';
import { HtmlEmailTemplateService } from './html-email-template.service';
import { Event } from '../../../domain/entities/event.entity';
import { User } from '../../../domain/entities/user.entity';

describe('HtmlEmailTemplateService', () => {
  let service: HtmlEmailTemplateService;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [HtmlEmailTemplateService],
    }).compile();

    service = module.get<HtmlEmailTemplateService>(HtmlEmailTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateVerificationEmailTemplate', () => {
    it('should generate verification email template', () => {
      const verificationLink = 'https://example.com/verify?token=test-token';
      const html = service.generateVerificationEmailTemplate(testUser, verificationLink);
      
      expect(html).toContain('Welcome to Compass Event!');
      expect(html).toContain('Hello Test User');
      expect(html).toContain(verificationLink);
    });
  });

  describe('generateAccountDeletedEmailTemplate', () => {
    it('should generate account deleted email template', () => {
      const html = service.generateAccountDeletedEmailTemplate(testUser);
      
      expect(html).toContain('Account Deleted');
      expect(html).toContain('Hello Test User');
    });
  });

  describe('generateEventCreatedEmailTemplate', () => {
    it('should generate event created email template', () => {
      const html = service.generateEventCreatedEmailTemplate(testEvent, testUser);
      
      expect(html).toContain('New Event Created');
      expect(html).toContain('Hello Test User');
      expect(html).toContain('Test Event');
      expect(html).toContain('Test Description');
      expect(html).toContain('Test Location');
      expect(html).toContain('calendar invitation');
    });
  });

  describe('generateEventDeletedEmailTemplate', () => {
    it('should generate event deleted email template', () => {
      const html = service.generateEventDeletedEmailTemplate(testEvent, testUser);
      
      expect(html).toContain('Event Deleted');
      expect(html).toContain('Hello Test User');
      expect(html).toContain('Test Event');
    });
  });

  describe('generateRegistrationConfirmationEmailTemplate', () => {
    it('should generate registration confirmation email template', () => {
      const html = service.generateRegistrationConfirmationEmailTemplate(testEvent, testUser);
      
      expect(html).toContain('Registration Confirmed');
      expect(html).toContain('Hello Test User');
      expect(html).toContain('Test Event');
      expect(html).toContain('Test Location');
      expect(html).toContain('calendar invitation');
    });
  });

  describe('generateRegistrationCancelledEmailTemplate', () => {
    it('should generate registration cancelled email template', () => {
      const html = service.generateRegistrationCancelledEmailTemplate(testEvent, testUser);
      
      expect(html).toContain('Registration Cancelled');
      expect(html).toContain('Hello Test User');
      expect(html).toContain('Test Event');
    });
  });

  describe('generateNewEventNotificationEmailTemplate', () => {
    it('should generate new event notification email template', () => {
      const html = service.generateNewEventNotificationEmailTemplate(testEvent, testUser);
      
      expect(html).toContain('New Event Available');
      expect(html).toContain('Hello Test User');
      expect(html).toContain('Test Event');
      expect(html).toContain('Test Description');
      expect(html).toContain('Test Location');
      expect(html).toContain('calendar invitation');
    });
  });
});