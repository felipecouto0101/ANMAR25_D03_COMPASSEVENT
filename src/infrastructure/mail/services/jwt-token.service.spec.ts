import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { JwtTokenService } from './jwt-token.service';
import * as jwt from 'jsonwebtoken';


jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('test-token'),
  verify: jest.fn().mockImplementation((token, secret) => {
    if (token === 'valid-token') {
      return { userId: 'user-id', email: 'test@example.com' };
    }
    throw new Error('Invalid token');
  })
}));

describe('JwtTokenService', () => {
  let service: JwtTokenService;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'EMAIL_VERIFICATION_SECRET') return 'test-secret';
        if (key === 'EMAIL_VERIFICATION_EXPIRY') return '24h';
        return undefined;
      })
    } as any;

   
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtTokenService,
        { provide: ConfigService, useValue: mockConfigService }
      ],
    }).compile();

    service = module.get<JwtTokenService>(JwtTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateToken', () => {
    it('should generate token with configured secret', () => {
      const token = service.generateToken('user-id', 'test@example.com');
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-id', email: 'test@example.com' },
        'test-secret',
        { expiresIn: '24h' }
      );
      expect(token).toBe('test-token');
    });

    it('should use default secret when not configured', () => {
    
      const newMockConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'EMAIL_VERIFICATION_SECRET') return undefined;
          if (key === 'EMAIL_VERIFICATION_EXPIRY') return '24h';
          return undefined;
        })
      } as any;
      
     
      const newService = new JwtTokenService(newMockConfigService);
      
      const token = newService.generateToken('user-id', 'test@example.com');
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-id', email: 'test@example.com' },
        'insecure-default-secret',
        { expiresIn: '24h' }
      );
      expect(token).toBe('test-token');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const result = service.verifyToken('valid-token');
      
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(result).toEqual({ userId: 'user-id', email: 'test@example.com' });
    });

    it('should return null for an invalid token', () => {
      const result = service.verifyToken('invalid-token');
      
      expect(jwt.verify).toHaveBeenCalledWith('invalid-token', 'test-secret');
      expect(result).toBeNull();
    });

    it('should use default secret when not configured', () => {
      
      const newMockConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'EMAIL_VERIFICATION_SECRET') return undefined;
          if (key === 'EMAIL_VERIFICATION_EXPIRY') return '24h';
          return undefined;
        })
      } as any;
      
     
      const newService = new JwtTokenService(newMockConfigService);
      
      newService.verifyToken('valid-token');
      
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'insecure-default-secret');
    });
  });
});