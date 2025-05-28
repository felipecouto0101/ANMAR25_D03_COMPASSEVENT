import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OwnerGuard } from './owner.guard';

describe('OwnerGuard', () => {
  let guard: OwnerGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new OwnerGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should throw ForbiddenException when user is not authenticated', () => {
      const mockRequest = {
        user: undefined,
        params: {},
      };

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should return true when user is admin', () => {
      const mockRequest = {
        user: { id: 'user-id', role: 'admin' },
        params: { id: 'resource-id' },
      };

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when user is accessing their own resource by userId', () => {
      const mockRequest = {
        user: { id: 'user-id', role: 'participant' },
        params: { userId: 'user-id' },
      };

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when user is accessing their own resource by id', () => {
      const mockRequest = {
        user: { id: 'user-id', role: 'participant' },
        params: { id: 'user-id' },
      };

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return false when user is not admin and not accessing their own resource', () => {
      const mockRequest = {
        user: { id: 'user-id', role: 'participant' },
        params: { id: 'other-id' },
      };

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
      } as unknown as ExecutionContext;

      expect(guard.canActivate(context)).toBe(false);
    });
  });
});