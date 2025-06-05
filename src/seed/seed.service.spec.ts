import { Test, TestingModule } from '@nestjs/testing';
import { SeedService } from './seed.service';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../modules/users/users.service';


jest.mock('@aws-sdk/client-s3', () => ({}));
jest.mock('@smithy/shared-ini-file-loader', () => ({}));
jest.mock('@smithy/node-config-provider', () => ({}));
jest.mock('@smithy/middleware-endpoint', () => ({}));
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true)
}));
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid')
}));
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue(Buffer.from('test-image')),
  promises: {
    readFile: jest.fn().mockResolvedValue(Buffer.from('test')),
    writeFile: jest.fn().mockResolvedValue(undefined)
  }
}));
jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('/mock/path/to/image.jpg')
}));
jest.mock('sharp', () => ({
  default: jest.fn().mockReturnValue({
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('test'))
  })
}));

describe('SeedService', () => {
  let service: SeedService;
  let usersService: UsersService;
  let configService: ConfigService;

  const mockUsersService = {
    findAll: jest.fn(),
    create: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  };

  const mockConfigService = {
    get: jest.fn((key) => {
      switch (key) {
        case 'DEFAULT_ADMIN_NAME':
          return 'Admin';
        case 'DEFAULT_ADMIN_EMAIL':
          return 'admin@admin.com';
        case 'DEFAULT_ADMIN_PASSWORD':
          return 'Admin@1012';
        default:
          return undefined;
      }
    })
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: ConfigService, useValue: mockConfigService }
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
    usersService = module.get<UsersService>(UsersService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('seed', () => {
    it('should seed default admin user', async () => {
      mockUsersService.findAll.mockResolvedValue({ items: [] });
      mockUsersService.create.mockResolvedValue({ id: 'admin-id', email: 'admin@admin.com', role: 'admin' });

      await service.seed();

      expect(mockUsersService.findAll).toHaveBeenCalled();
      expect(mockUsersService.create).toHaveBeenCalled();
    });

    it('should not create admin if already exists', async () => {
      mockUsersService.findAll.mockResolvedValue({ 
        items: [{ id: 'admin-id', email: 'admin@admin.com', role: 'admin' }] 
      });

      await service.seed();

      expect(mockUsersService.findAll).toHaveBeenCalled();
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });
  });
});