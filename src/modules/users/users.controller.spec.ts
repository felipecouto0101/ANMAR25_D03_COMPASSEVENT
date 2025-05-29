import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UserResponseDto } from './dto/user-response.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUserResponse = {
    id: 'user-id',
    name: 'Test User',
    email: 'test@example.com',
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

  beforeEach(async () => {
    const mockUsersService = {
      create: jest.fn().mockResolvedValue(mockUserResponse),
      verifyEmail: jest.fn().mockResolvedValue(true),
      findAll: jest.fn().mockResolvedValue({ items: [mockUserResponse], total: 1 }),
      findById: jest.fn().mockResolvedValue(mockUserResponse),
      update: jest.fn().mockResolvedValue(mockUserResponse),
      delete: jest.fn().mockResolvedValue(true),
    };

    controller = new UsersController(mockUsersService as any);
    usersService = mockUsersService as any;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

      const result = await controller.create(createUserDto, mockFile);

      expect(usersService.create).toHaveBeenCalledWith(createUserDto, mockFile);
      expect(result).toEqual(mockUserResponse);
    });

    it('should create a user without profile image', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        phone: '+1234567890',
        role: 'participant',
      };

      const result = await controller.create(createUserDto);

      expect(usersService.create).toHaveBeenCalledWith(createUserDto, undefined);
      expect(result).toEqual(mockUserResponse);
    });
  });

  describe('verifyEmail', () => {
    it('should verify user email', async () => {
      const result = await controller.verifyEmail('valid-token');

      expect(usersService.verifyEmail).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual({ success: true });
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const queryDto: QueryUsersDto = {
        page: 1,
        limit: 10,
      };

      const req = {
        user: { id: 'admin-id', role: 'admin' },
      };

      const result = await controller.findAll(queryDto, req);

      expect(usersService.findAll).toHaveBeenCalledWith(queryDto, 'admin-id', 'admin');
      expect(result).toEqual({ items: [mockUserResponse], total: 1 });
    });

    it('should use mock values when user is not in request', async () => {
      const queryDto: QueryUsersDto = {
        page: 1,
        limit: 10,
      };

      const req = {};

      await controller.findAll(queryDto, req);

      expect(usersService.findAll).toHaveBeenCalledWith(queryDto, 'mock-user-id', 'admin');
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const req = {
        user: { id: 'user-id', role: 'participant' },
      };

      const result = await controller.findOne('user-id', req);

      expect(usersService.findById).toHaveBeenCalledWith('user-id', 'user-id', 'participant');
      expect(result).toEqual(mockUserResponse);
    });

    it('should use mock values when user is not in request', async () => {
      const req = {};

      await controller.findOne('user-id', req);

      expect(usersService.findById).toHaveBeenCalledWith('user-id', 'mock-user-id', 'admin');
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const req = {
        user: { id: 'user-id', role: 'participant' },
      };

      const result = await controller.update('user-id', updateUserDto, req, mockFile);

      expect(usersService.update).toHaveBeenCalledWith('user-id', updateUserDto, 'user-id', 'participant', mockFile);
      expect(result).toEqual(mockUserResponse);
    });

    it('should update a user without profile image', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const req = {
        user: { id: 'user-id', role: 'participant' },
      };

      const result = await controller.update('user-id', updateUserDto, req);

      expect(usersService.update).toHaveBeenCalledWith('user-id', updateUserDto, 'user-id', 'participant', undefined);
      expect(result).toEqual(mockUserResponse);
    });

    it('should use mock values when user is not in request', async () => {
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const req = {};

      await controller.update('user-id', updateUserDto, req);

      expect(usersService.update).toHaveBeenCalledWith('user-id', updateUserDto, 'mock-user-id', 'admin', undefined);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      const req = {
        user: { id: 'user-id', role: 'participant' },
      };

      const result = await controller.remove('user-id', req);

      expect(usersService.delete).toHaveBeenCalledWith('user-id', 'user-id', 'participant');
      expect(result).toBe(true);
    });

    it('should use mock values when user is not in request', async () => {
      const req = {};

      await controller.remove('user-id', req);

      expect(usersService.delete).toHaveBeenCalledWith('user-id', 'mock-user-id', 'admin');
    });
  });
});