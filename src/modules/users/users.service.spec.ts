import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { User } from '../../domain/entities/user.entity';
import { 
  EntityNotFoundException, 
  ValidationException, 
  AuthorizationException, 
  ConflictException 
} from '../../domain/exceptions/domain.exceptions';


jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn(),
  SendEmailCommand: jest.fn(),
  ListVerifiedEmailAddressesCommand: jest.fn()
}));

jest.mock('sharp', () => ({
  default: jest.fn().mockReturnValue({
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('test'))
  })
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
      expect(s3Service.uploadFile).toHaveBeenCalled();
      expect(userRepository.create).toHaveBeenCalled();
      expect(mailService.sendVerificationEmail).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe('user-id');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw ValidationException when profile image is missing', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        phone: '+1234567890',
        role: 'participant',
      };

      await expect(
        service.create(createUserDto)
      ).rejects.toThrow(ValidationException);
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
        service.create(createUserDto, mockFile),
      ).rejects.toThrow(ConflictException);
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

    it('should return true if email is already verified', async () => {
      userRepository.findById.mockResolvedValueOnce({
        ...mockUser,
        emailVerified: true,
      });

      const result = await service.verifyEmail('valid-token');

      expect(userRepository.update).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw ValidationException when token is invalid', async () => {
      mailService.verifyEmailToken.mockReturnValueOnce(null);

      await expect(
        service.verifyEmail('invalid-token'),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw EntityNotFoundException when user is not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      await expect(
        service.verifyEmail('valid-token'),
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw ValidationException when token email does not match user email', async () => {
      mailService.verifyEmailToken.mockReturnValueOnce({
        userId: 'user-id',
        email: 'different@example.com',
      });

      await expect(
        service.verifyEmail('valid-token'),
      ).rejects.toThrow(ValidationException);
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
        name: undefined,
        email: undefined,
        role: undefined,
        active: true,
        page: 1,
        limit: 10,
      });
      expect(result).toBeDefined();
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should throw AuthorizationException when user is not admin', async () => {
      const queryDto: QueryUsersDto = {
        page: 1,
        limit: 10,
      };

      await expect(
        service.findAll(queryDto, 'user-id', 'participant'),
      ).rejects.toThrow(AuthorizationException);
    });

    it('should use default pagination values when not provided', async () => {
      const queryDto: QueryUsersDto = {};

      await service.findAll(queryDto, 'admin-id', 'admin');

      expect(userRepository.findWithFilters).toHaveBeenCalledWith({
        name: undefined,
        email: undefined,
        role: undefined,
        active: true,
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

    it('should throw AuthorizationException when user tries to view another user', async () => {
      await expect(
        service.findById('user-id', 'different-id', 'participant'),
      ).rejects.toThrow(AuthorizationException);
    });

    it('should throw EntityNotFoundException when user is not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      await expect(
        service.findById('nonexistent-id', 'admin-id', 'admin'),
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw EntityNotFoundException when user is inactive', async () => {
      userRepository.findById.mockResolvedValueOnce({
        ...mockUser,
        active: false,
      });

      await expect(
        service.findById('inactive-id', 'admin-id', 'admin'),
      ).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const result = await service.update('user-id', updateUserDto, 'user-id', 'participant', mockFile);

      expect(userRepository.findById).toHaveBeenCalledWith('user-id');
      expect(s3Service.uploadFile).toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should allow admin to update any user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      await service.update('user-id', updateUserDto, 'admin-id', 'admin');

      expect(userRepository.update).toHaveBeenCalled();
    });

    it('should throw AuthorizationException when user tries to update another user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      await expect(
        service.update('user-id', updateUserDto, 'different-id', 'participant'),
      ).rejects.toThrow(AuthorizationException);
    });

    it('should throw EntityNotFoundException when user is not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      await expect(
        service.update('nonexistent-id', updateUserDto, 'admin-id', 'admin'),
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw EntityNotFoundException when user is inactive', async () => {
      userRepository.findById.mockResolvedValueOnce({
        ...mockUser,
        active: false,
      });

      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      await expect(
        service.update('inactive-id', updateUserDto, 'admin-id', 'admin'),
      ).rejects.toThrow(EntityNotFoundException);
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
        service.update('user-id', updateUserDto, 'user-id', 'participant'),
      ).rejects.toThrow(ConflictException);
    });

    it('should set emailVerified to false when email is changed', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'new@example.com',
      };

      await service.update('user-id', updateUserDto, 'user-id', 'participant');

      expect(userRepository.update).toHaveBeenCalledWith('user-id', expect.objectContaining({
        emailVerified: false,
      }));
      expect(mailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should update password when provided', async () => {
      const updateUserDto: UpdateUserDto = {
        password: 'NewPassword123',
      };

      await service.update('user-id', updateUserDto, 'user-id', 'participant');

      expect(userRepository.update).toHaveBeenCalled();
    });

    it('should throw EntityNotFoundException when update fails', async () => {
      userRepository.update.mockResolvedValueOnce(null);

      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      await expect(
        service.update('user-id', updateUserDto, 'user-id', 'participant'),
      ).rejects.toThrow(EntityNotFoundException);
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

    it('should throw AuthorizationException when user tries to delete another user', async () => {
      await expect(
        service.delete('user-id', 'different-id', 'participant'),
      ).rejects.toThrow(AuthorizationException);
    });

    it('should throw EntityNotFoundException when user is not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      await expect(
        service.delete('nonexistent-id', 'admin-id', 'admin'),
      ).rejects.toThrow(EntityNotFoundException);
    });
  });
});