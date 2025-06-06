import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SeedService } from './seed.service';
import { UsersService } from '../modules/users/users.service';
import { Logger } from '@nestjs/common';


jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn(),
  SendEmailCommand: jest.fn(),
  ListVerifiedEmailAddressesCommand: jest.fn()
}));

jest.mock('fs');
jest.mock('path');
jest.mock('ical-generator', () => ({
  default: jest.fn().mockReturnValue({
    createEvent: jest.fn().mockReturnThis(),
    toString: jest.fn().mockReturnValue('test-ical')
  })
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('test-token'),
  verify: jest.fn().mockReturnValue({ userId: 'test-id', email: 'test@example.com' })
}));

describe('SeedService', () => {
  let service: SeedService;
  let configService: ConfigService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SeedService>(SeedService);
    configService = module.get<ConfigService>(ConfigService);
    usersService = module.get<UsersService>(UsersService);

    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    
    
    jest.requireMock('path').join.mockReturnValue('/mock/path/default-profile.jpg');
    
 
    jest.requireMock('fs').readFileSync.mockReturnValue(Buffer.from('test-image-data'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('seed', () => {
    it('should call seedDefaultAdmin', async () => {
      const seedDefaultAdminSpy = jest.spyOn(service as any, 'seedDefaultAdmin').mockResolvedValue(undefined);
      
      await service.seed();
      
      expect(seedDefaultAdminSpy).toHaveBeenCalled();
    });
  });

  describe('seedDefaultAdmin', () => {
    it('should not create admin if environment variables are missing', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);
      
      await (service as any).seedDefaultAdmin();
      
      expect(usersService.findAll).not.toHaveBeenCalled();
      expect(usersService.create).not.toHaveBeenCalled();
      expect(Logger.prototype.warn).toHaveBeenCalled();
    });

    it('should not create admin if admin already exists', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key) => {
        const values = {
          DEFAULT_ADMIN_EMAIL: 'admin@example.com',
          DEFAULT_ADMIN_NAME: 'Admin User',
          DEFAULT_ADMIN_PASSWORD: 'password123',
        };
        return values[key];
      });
      
      jest.spyOn(usersService, 'findAll').mockResolvedValue({
        items: [{
          id: 'admin-id',
          email: 'admin@example.com',
          name: 'Admin User',
          phone: '+1234567890',
          role: 'admin',
          emailVerified: true,
          active: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }],
        total: 1,
      });
      
      await (service as any).seedDefaultAdmin();
      
      expect(usersService.findAll).toHaveBeenCalledWith(
        { email: 'admin@example.com', limit: 1, page: 1 },
        'system',
        'admin'
      );
      expect(usersService.create).not.toHaveBeenCalled();
      expect(Logger.prototype.log).toHaveBeenCalled();
    });

    it('should create admin if admin does not exist', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key) => {
        const values = {
          DEFAULT_ADMIN_EMAIL: 'admin@example.com',
          DEFAULT_ADMIN_NAME: 'Admin User',
          DEFAULT_ADMIN_PASSWORD: 'password123',
        };
        return values[key];
      });
      
      jest.spyOn(usersService, 'findAll').mockResolvedValue({
        items: [],
        total: 0,
      });
      
      jest.spyOn(usersService, 'create').mockResolvedValue({
        id: 'new-admin-id',
        email: 'admin@example.com',
        name: 'Admin User',
        phone: '+1234567890',
        role: 'admin',
        emailVerified: true,
        active: true,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      });
      
      await (service as any).seedDefaultAdmin();
      
      expect(usersService.findAll).toHaveBeenCalled();
      expect(usersService.create).toHaveBeenCalledWith(
        {
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'password123',
          phone: '+1234567890',
          role: 'admin',
        },
        expect.objectContaining({
          fieldname: 'profileImage',
          originalname: 'default-profile.jpg',
          buffer: expect.any(Buffer)
        })
      );
      expect(Logger.prototype.log).toHaveBeenCalled();
    });

    it('should handle errors when creating admin', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key) => {
        const values = {
          DEFAULT_ADMIN_EMAIL: 'admin@example.com',
          DEFAULT_ADMIN_NAME: 'Admin User',
          DEFAULT_ADMIN_PASSWORD: 'password123',
        };
        return values[key];
      });
      
      jest.spyOn(usersService, 'findAll').mockResolvedValue({
        items: [],
        total: 0,
      });
      
      const error = new Error('Database error');
      jest.spyOn(usersService, 'create').mockRejectedValue(error);
      
      await (service as any).seedDefaultAdmin();
      
      expect(usersService.findAll).toHaveBeenCalled();
      expect(usersService.create).toHaveBeenCalled();
      expect(Logger.prototype.error).toHaveBeenCalledWith(`Failed to seed default admin user: ${error.message}`);
    });
    
    it('should use fallback image when file read fails', async () => {
      jest.spyOn(configService, 'get').mockImplementation((key) => {
        const values = {
          DEFAULT_ADMIN_EMAIL: 'admin@example.com',
          DEFAULT_ADMIN_NAME: 'Admin User',
          DEFAULT_ADMIN_PASSWORD: 'password123',
        };
        return values[key];
      });
      
      jest.spyOn(usersService, 'findAll').mockResolvedValue({
        items: [],
        total: 0,
      });
      
      
      jest.requireMock('fs').readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });
      
      await (service as any).seedDefaultAdmin();
      
      expect(usersService.create).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          fieldname: 'profileImage',
          originalname: 'default-profile.jpg',
          buffer: expect.any(Buffer)
        })
      );
      expect(Logger.prototype.warn).toHaveBeenCalledWith('Default profile image not found, using placeholder');
    });
  });
});