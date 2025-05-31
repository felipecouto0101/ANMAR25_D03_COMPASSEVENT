import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RegistrationOwnerGuard } from './registration-owner.guard';
import { RegistrationsService } from '../../registrations/registrations.service';

describe('RegistrationOwnerGuard', () => {
  let guard: RegistrationOwnerGuard;
  let registrationsService: RegistrationsService;
  let findByIdMock: jest.Mock;

  beforeEach(() => {
    findByIdMock = jest.fn();
    
    const mockRegistrationsService = {
      
      ['registrationRepository']: {
        findById: findByIdMock,
      },
    };

    registrationsService = mockRegistrationsService as any;
    guard = new RegistrationOwnerGuard(registrationsService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should throw ForbiddenException when user is not authenticated', async () => {
      const mockRequest = {
        user: undefined,
        params: { id: 'registration-id' },
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
        params: { id: 'registration-id' },
      };

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should return true when no registration ID is provided', async () => {
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

    it('should return true when user is the owner of the registration', async () => {
      const mockRequest = {
        user: { id: 'user-id', role: 'participant' },
        params: { id: 'registration-id' },
      };

      const mockRegistration = {
        id: 'registration-id',
        userId: 'user-id',
        eventId: 'event-id',
      };

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      findByIdMock.mockResolvedValue(mockRegistration);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(findByIdMock).toHaveBeenCalledWith('registration-id');
    });

    it('should return false when user is not the owner of the registration', async () => {
      const mockRequest = {
        user: { id: 'user-id', role: 'participant' },
        params: { id: 'registration-id' },
      };

      const mockRegistration = {
        id: 'registration-id',
        userId: 'different-user-id',
        eventId: 'event-id',
      };

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      findByIdMock.mockResolvedValue(mockRegistration);

      const result = await guard.canActivate(context);
      expect(result).toBe(false);
      expect(findByIdMock).toHaveBeenCalledWith('registration-id');
    });

    it('should return false when registration is not found', async () => {
      const mockRequest = {
        user: { id: 'user-id', role: 'participant' },
        params: { id: 'registration-id' },
      };

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      findByIdMock.mockResolvedValue(null);

      const result = await guard.canActivate(context);
      expect(result).toBe(false);
      expect(findByIdMock).toHaveBeenCalledWith('registration-id');
    });

    it('should return false when an error occurs', async () => {
      const mockRequest = {
        user: { id: 'user-id', role: 'participant' },
        params: { id: 'registration-id' },
      };

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      findByIdMock.mockRejectedValue(new Error('Database error'));

      const result = await guard.canActivate(context);
      expect(result).toBe(false);
      expect(findByIdMock).toHaveBeenCalledWith('registration-id');
    });
  });
});