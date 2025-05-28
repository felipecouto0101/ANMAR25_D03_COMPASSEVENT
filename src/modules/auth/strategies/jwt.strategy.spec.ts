import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: any;
  let configService: ConfigService;

  const mockUser = {
    id: 'test-id',
    email: 'test@example.com',
    role: 'participant',
    active: true,
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findById: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: 'UserRepository',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    userRepository = module.get('UserRepository');
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user data when token payload is valid', async () => {
      const payload = { sub: 'test-id', email: 'test@example.com', role: 'participant' };
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(userRepository.findById).toHaveBeenCalledWith('test-id');
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const payload = { sub: 'nonexistent-id', email: 'test@example.com', role: 'participant' };
      userRepository.findById.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      expect(userRepository.findById).toHaveBeenCalledWith('nonexistent-id');
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const payload = { sub: 'test-id', email: 'test@example.com', role: 'participant' };
      userRepository.findById.mockResolvedValue({ ...mockUser, active: false });

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
      expect(userRepository.findById).toHaveBeenCalledWith('test-id');
    });
  });
});