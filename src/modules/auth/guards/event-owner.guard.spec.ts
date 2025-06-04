import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { EventOwnerGuard } from './event-owner.guard';
import { EventsService } from '../../events/events.service';

describe('EventOwnerGuard', () => {
  let guard: EventOwnerGuard;
  let eventsService: EventsService;

  beforeEach(() => {
    const mockEventsService = {
      findById: jest.fn(),
    };

    eventsService = mockEventsService as any;
    guard = new EventOwnerGuard(eventsService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should throw ForbiddenException when user is not authenticated', async () => {
      const mockRequest = {
        user: undefined,
        params: { id: 'event-id' },
      };

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should return true when user is admin', async () => {
      const mockRequest = {
        user: { id: 'user-id', role: 'admin' },
        params: { id: 'event-id' },
      };

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should return true when no event ID is provided', async () => {
      const mockRequest = {
        user: { id: 'user-id', role: 'participant' },
        params: {},
      };

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should return true when user is the organizer of the event', async () => {
      const mockRequest = {
        user: { id: 'organizer-id', role: 'organizer' },
        params: { id: 'event-id' },
      };

      const mockEvent = {
        id: 'event-id',
        organizerId: 'organizer-id',
        name: 'Test Event',
      };

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      eventsService.findById = jest.fn().mockResolvedValue(mockEvent);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(eventsService.findById).toHaveBeenCalledWith('event-id');
    });

    it('should return false when user is not the organizer of the event', async () => {
      const mockRequest = {
        user: { id: 'user-id', role: 'participant' },
        params: { id: 'event-id' },
      };

      const mockEvent = {
        id: 'event-id',
        organizerId: 'different-organizer-id',
        name: 'Test Event',
      };

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      eventsService.findById = jest.fn().mockResolvedValue(mockEvent);

      const result = await guard.canActivate(context);
      expect(result).toBe(false);
      expect(eventsService.findById).toHaveBeenCalledWith('event-id');
    });

    it('should return false when event is not found', async () => {
      const mockRequest = {
        user: { id: 'user-id', role: 'participant' },
        params: { id: 'event-id' },
      };

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      eventsService.findById = jest.fn().mockResolvedValue(null);

      const result = await guard.canActivate(context);
      expect(result).toBe(false);
      expect(eventsService.findById).toHaveBeenCalledWith('event-id');
    });

    it('should return false when an error occurs', async () => {
      const mockRequest = {
        user: { id: 'user-id', role: 'participant' },
        params: { id: 'event-id' },
      };

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      eventsService.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await guard.canActivate(context);
      expect(result).toBe(false);
      expect(eventsService.findById).toHaveBeenCalledWith('event-id');
    });
  });
});