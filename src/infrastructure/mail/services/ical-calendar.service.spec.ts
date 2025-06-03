import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { IcalCalendarService } from './ical-calendar.service';
import { Event } from '../../../domain/entities/event.entity';
import { User } from '../../../domain/entities/user.entity';


jest.mock('ical-generator', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      createEvent: jest.fn().mockReturnThis(),
      toString: jest.fn().mockReturnValue('test-ical-content')
    }))
  };
});

describe('IcalCalendarService', () => {
  let service: IcalCalendarService;
  let mockConfigService: jest.Mocked<ConfigService>;

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

  beforeEach(async () => {
    
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'FRONTEND_URL') return 'https://example.com';
        return undefined;
      })
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IcalCalendarService,
        { provide: ConfigService, useValue: mockConfigService }
      ],
    }).compile();

    service = module.get<IcalCalendarService>(IcalCalendarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateEventCalendar', () => {
    it('should generate calendar attachment without organizer', () => {
      const result = service.generateEventCalendar(testEvent);
      
      expect(result).toEqual({
        filename: 'Test_Event.ics',
        content: 'test-ical-content',
        contentType: 'text/calendar'
      });
    });

    it('should generate calendar attachment with organizer', () => {
      const result = service.generateEventCalendar(testEvent, testUser);
      
      expect(result).toEqual({
        filename: 'Test_Event.ics',
        content: 'test-ical-content',
        contentType: 'text/calendar'
      });
    });

    it('should sanitize filename', () => {
      const eventWithSpecialChars = {
        ...testEvent,
        name: 'Test: Event! With @ Special # Characters'
      };
      
      const result = service.generateEventCalendar(eventWithSpecialChars);
      
      expect(result.filename).toBe('Test__Event__With___Special___Characters.ics');
    });
    
    it('should handle undefined frontendUrl', () => {
      
      const noUrlConfigService = {
        get: jest.fn().mockReturnValue(undefined)
      } as any;
      
     
      const serviceWithoutUrl = new IcalCalendarService(noUrlConfigService);
      
      const result = serviceWithoutUrl.generateEventCalendar(testEvent);
      
      expect(result).toBeDefined();
      expect(result.filename).toBe('Test_Event.ics');
      expect(result.contentType).toBe('text/calendar');
    });
  });
});