import { Test, TestingModule } from '@nestjs/testing';
import { SeedService } from './seed.service';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../modules/users/users.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';


jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({}),
      config: {},
      middlewareStack: {
        add: jest.fn(),
        addRelativeTo: jest.fn(),
        clone: jest.fn(),
        remove: jest.fn(),
        resolve: jest.fn(),
        use: jest.fn(),
      }
    })),
    PutObjectCommand: jest.fn()
  };
});


jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true)
}));


jest.mock('uuid');
(uuidv4 as jest.Mock).mockReturnValue('mock-uuid');


jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue(Buffer.from('test-image'))
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

      expect(mockUsersService.findAll).toHaveBeenCalledWith(
        { email: 'admin@admin.com', limit: 1, page: 1 },
        'system',
        'admin'
      );
      expect(mockUsersService.create).toHaveBeenCalledWith(
        {
          name: 'Admin',
          email: 'admin@admin.com',
          password: 'Admin@1012',
          phone: '+1234567890',
          role: 'admin'
        },
        expect.objectContaining({
          fieldname: 'profileImage',
          originalname: 'default-profile.jpg',
          mimetype: 'image/jpeg',
          buffer: expect.any(Buffer)
        })
      );
    });

    it('should not create admin if already exists', async () => {
      mockUsersService.findAll.mockResolvedValue({ 
        items: [{ id: 'admin-id', email: 'admin@admin.com', role: 'admin' }] 
      });

      await service.seed();

      expect(mockUsersService.findAll).toHaveBeenCalled();
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it('should handle missing environment variables', async () => {
      mockConfigService.get.mockImplementation(() => undefined);

      await service.seed();

      expect(mockUsersService.findAll).not.toHaveBeenCalled();
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it('should handle errors when creating admin', async () => {
      mockUsersService.findAll.mockResolvedValue({ items: [] });
      mockUsersService.create.mockRejectedValue(new Error('Test error'));

      await service.seed();

      expect(mockUsersService.findAll).toHaveBeenCalled();
      expect(mockUsersService.create).toHaveBeenCalled();
     
    });

    it('should handle file read errors', async () => {
      mockUsersService.findAll.mockResolvedValue({ items: [] });
      mockUsersService.create.mockResolvedValue({ id: 'admin-id', email: 'admin@admin.com', role: 'admin' });
      (fs.readFileSync as jest.Mock).mockImplementationOnce(() => {
        throw new Error('File not found');
      });

      await service.seed();

      expect(mockUsersService.create).toHaveBeenCalled();
     
      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          buffer: expect.any(Buffer)
        })
      );
    });
  });
});