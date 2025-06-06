import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { User } from '../../domain/entities/user.entity';
import { 
  NotFoundException
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid');
(uuidv4 as jest.Mock).mockReturnValue('test-uuid');

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn(),
  SendEmailCommand: jest.fn(),
  ListVerifiedEmailAddressesCommand: jest.fn()
}));



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

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: any;
  let s3Service: any;
  let mailService: any;

  const mockUser: User = {
    id: 'user-id',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword123',
    phone: '+1234567890',
    role: 'participant',
    profileImageUrl: 'http://example.com/image.jpg',
    emailVerified: false,
    active: true,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  const mockFile = {
    fieldname: 'profileImage',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test'),
    size: 1024,
  };

  const mockDateString = '2023-01-01T00:00:00.000Z';

  beforeEach(async () => {
    const mockUserRepository = {
      create: jest.fn().mockResolvedValue(mockUser),
      findById: jest.fn().mockResolvedValue(mockUser),
      findByEmail: jest.fn().mockResolvedValue(null),
      findWithFilters: jest.fn().mockResolvedValue({ items: [mockUser], total: 1 }),
      findAll: jest.fn().mockResolvedValue([mockUser]),
      update: jest.fn().mockResolvedValue(mockUser),
      delete: jest.fn().mockResolvedValue(true),
    };

    const mockS3Service = {
      uploadFile: jest.fn().mockResolvedValue('http://example.com/image.jpg'),
    };

    const mockMailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      verifyEmailToken: jest.fn().mockReturnValue({ userId: 'user-id', email: 'test@example.com' }),
      sendAccountDeletedEmail: jest.fn().mockResolvedValue(undefined),
    };

    service = new UsersService(
      mockUserRepository as any,
      mockS3Service as any,
      mockMailService as any
    );

    userRepository = mockUserRepository;
    s3Service = mockS3Service;
    mailService = mockMailService;

    jest.spyOn(Date, 'now').mockImplementation(() => new Date(mockDateString).getTime());
    jest.spyOn(global.console, 'error').mockImplementation(() => {});
    
    
    const MockDate = class extends Date {
      constructor() {
        super(mockDateString);
      }
      
      toISOString() {
        return mockDateString;
      }
    };
    
    global.Date = MockDate as DateConstructor;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.Date = Date;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        phone: '+1234567890',
        role: 'participant',
      };

      const result = await service.create(createUserDto, mockFile);

      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(s3Service.uploadFile).toHaveBeenCalledWith(
        mockFile, 
        expect.stringContaining('profiles/test-uuid')
      );
      expect(userRepository.create).toHaveBeenCalled();
      expect(mailService.sendVerificationEmail).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe('test-uuid');
      expect(result.email).toBe('test@example.com');
    });

    it('should create a user without profile image', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        phone: '+1234567890',
        role: 'participant',
      };

      const result = await service.create(createUserDto);
      
      expect(result).toBeDefined();
      expect(s3Service.uploadFile).not.toHaveBeenCalled();
      expect(result.profileImageUrl).toBe('');
    });

    it('should throw ConflictException when email already exists', async () => {
      userRepository.findByEmail.mockResolvedValueOnce(mockUser);

      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        phone: '+1234567890',
        role: 'participant',
      };

      await expect(
        service.create(createUserDto, mockFile)
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('verifyEmail', () => {
    it('should verify user email', async () => {
      const result = await service.verifyEmail('valid-token');

      expect(mailService.verifyEmailToken).toHaveBeenCalledWith('valid-token');
      expect(userRepository.findById).toHaveBeenCalledWith('user-id');
      expect(userRepository.update).toHaveBeenCalledWith('user-id', {
        emailVerified: true,
        updatedAt: mockDateString,
      });
      expect(result).toBe(true);
    });

    it('should return false if token is invalid', async () => {
      mailService.verifyEmailToken.mockReturnValueOnce(null);

      const result = await service.verifyEmail('invalid-token');
      
      expect(result).toBe(false);
    });

    it('should return false if user is not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      const result = await service.verifyEmail('valid-token');
      
      expect(result).toBe(false);
    });

    it('should return false if token email does not match user email', async () => {
      mailService.verifyEmailToken.mockReturnValueOnce({
        userId: 'user-id',
        email: 'different@example.com',
      });

      const result = await service.verifyEmail('valid-token');
      
      expect(result).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return all users with pagination', async () => {
      const queryDto: QueryUsersDto = {
        page: 1,
        limit: 10,
      };

      const result = await service.findAll(queryDto, 'admin-id', 'admin');

      expect(userRepository.findWithFilters).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
      expect(result).toBeDefined();
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should return empty array for non-admin users', async () => {
      const queryDto: QueryUsersDto = {
        page: 1,
        limit: 10,
      };

      const result = await service.findAll(queryDto, 'user-id', 'participant');
      
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should use default pagination values when not provided', async () => {
      const queryDto: QueryUsersDto = {};

      await service.findAll(queryDto, 'admin-id', 'admin');

      expect(userRepository.findWithFilters).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const result = await service.findById('user-id', 'user-id', 'participant');

      expect(userRepository.findById).toHaveBeenCalledWith('user-id');
      expect(result).toBeDefined();
      expect(result.id).toBe('user-id');
    });

    it('should allow admin to view any user', async () => {
      const result = await service.findById('user-id', 'admin-id', 'admin');

      expect(userRepository.findById).toHaveBeenCalledWith('user-id');
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when user tries to view another user', async () => {
      await expect(
        service.findById('user-id', 'different-id', 'participant')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user is not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      await expect(
        service.findById('nonexistent-id', 'admin-id', 'admin')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const result = await service.update('user-id', updateUserDto, 'user-id', 'participant', mockFile);

      expect(userRepository.findById).toHaveBeenCalledWith('user-id');
      expect(s3Service.uploadFile).toHaveBeenCalledWith(
        mockFile, 
        expect.stringContaining('profiles/user-id')
      );
      expect(userRepository.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should update a user with role', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
        role: 'organizer'
      };

      await service.update('user-id', updateUserDto, 'user-id', 'participant');

      expect(userRepository.update).toHaveBeenCalledWith('user-id', expect.objectContaining({
        role: 'organizer'
      }));
    });

    it('should update a user with password', async () => {
      const updateUserDto: UpdateUserDto = {
        password: 'NewPassword123'
      };

      await service.update('user-id', updateUserDto, 'user-id', 'participant');

      expect(userRepository.update).toHaveBeenCalledWith('user-id', expect.objectContaining({
        password: expect.any(String)
      }));
    });

    it('should allow admin to update any user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      await service.update('user-id', updateUserDto, 'admin-id', 'admin');

      expect(userRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user tries to update another user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      await expect(
        service.update('user-id', updateUserDto, 'different-id', 'participant')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user is not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      await expect(
        service.update('nonexistent-id', updateUserDto, 'admin-id', 'admin')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when email already exists', async () => {
      userRepository.findByEmail.mockResolvedValueOnce({
        ...mockUser,
        id: 'different-id',
      });

      const updateUserDto: UpdateUserDto = {
        email: 'existing@example.com',
      };

      await expect(
        service.update('user-id', updateUserDto, 'user-id', 'participant')
      ).rejects.toThrow('Email already exists');
    });

    it('should update email when changed', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'new@example.com',
      };

      await service.update('user-id', updateUserDto, 'user-id', 'participant');

      expect(userRepository.update).toHaveBeenCalledWith('user-id', expect.objectContaining({
        email: 'new@example.com',
      }));
    });

    it('should throw NotFoundException when user is not found after update', async () => {
      userRepository.findById.mockResolvedValueOnce(mockUser);
      userRepository.update.mockResolvedValueOnce(mockUser);
      userRepository.findById.mockResolvedValueOnce(null);

      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      await expect(
        service.update('user-id', updateUserDto, 'user-id', 'participant')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should deactivate a user', async () => {
      const result = await service.delete('user-id', 'user-id', 'participant');

      expect(userRepository.findById).toHaveBeenCalledWith('user-id');
      expect(userRepository.update).toHaveBeenCalledWith('user-id', {
        active: false,
        updatedAt: mockDateString,
      });
      expect(mailService.sendAccountDeletedEmail).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should allow admin to delete any user', async () => {
      await service.delete('user-id', 'admin-id', 'admin');

      expect(userRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user tries to delete another user', async () => {
      await expect(
        service.delete('user-id', 'different-id', 'participant')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user is not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      await expect(
        service.delete('nonexistent-id', 'admin-id', 'admin')
      ).rejects.toThrow(NotFoundException);
    });
  });
});