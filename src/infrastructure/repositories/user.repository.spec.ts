import { Test, TestingModule } from '@nestjs/testing';
import { UserDynamoDBRepository } from './user.repository';
import { DynamoDBService } from '../database/dynamodb/dynamodb.service';
import { User } from '../../domain/entities/user.entity';

describe('UserDynamoDBRepository', () => {
  let repository: UserDynamoDBRepository;
  let dynamoDBService: DynamoDBService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserDynamoDBRepository,
        {
          provide: DynamoDBService,
          useValue: {
            put: jest.fn(),
            get: jest.fn(),
            scan: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<UserDynamoDBRepository>(UserDynamoDBRepository);
    dynamoDBService = module.get<DynamoDBService>(DynamoDBService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser: User = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        phone: '+1234567890',
        role: 'participant',
        emailVerified: true,
        active: true,
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z',
      };

      (dynamoDBService.scan as jest.Mock).mockResolvedValueOnce({
        Items: [mockUser],
      });

      const result = await repository.findByEmail('test@example.com');

      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Users',
        FilterExpression: '#email = :email AND #active = :active',
        ExpressionAttributeNames: {
          '#email': 'email',
          '#active': 'active',
        },
        ExpressionAttributeValues: {
          ':email': 'test@example.com',
          ':active': true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      (dynamoDBService.scan as jest.Mock).mockResolvedValueOnce({
        Items: [],
      });

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findWithFilters', () => {
    it('should find users with name filter', async () => {
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashedPassword',
          phone: '+1234567890',
          role: 'participant',
          emailVerified: true,
          active: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
      ];

      (dynamoDBService.scan as jest.Mock).mockResolvedValueOnce({
        Items: mockUsers,
      });

      const result = await repository.findWithFilters({
        name: 'John',
        page: 1,
        limit: 10,
      });

      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Users',
        FilterExpression: 'contains(#name, :name)',
        ExpressionAttributeNames: {
          '#name': 'name',
        },
        ExpressionAttributeValues: {
          ':name': 'John',
        },
      });
      expect(result).toEqual({
        items: mockUsers,
        total: 1,
      });
    });

    it('should find users with email filter', async () => {
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashedPassword',
          phone: '+1234567890',
          role: 'participant',
          emailVerified: true,
          active: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
      ];

      (dynamoDBService.scan as jest.Mock).mockResolvedValueOnce({
        Items: mockUsers,
      });

      const result = await repository.findWithFilters({
        email: 'john',
        page: 1,
        limit: 10,
      });

      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Users',
        FilterExpression: 'contains(#email, :email)',
        ExpressionAttributeNames: {
          '#email': 'email',
        },
        ExpressionAttributeValues: {
          ':email': 'john',
        },
      });
      expect(result).toEqual({
        items: mockUsers,
        total: 1,
      });
    });

    it('should find users with role filter', async () => {
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashedPassword',
          phone: '+1234567890',
          role: 'admin',
          emailVerified: true,
          active: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
      ];

      (dynamoDBService.scan as jest.Mock).mockResolvedValueOnce({
        Items: mockUsers,
      });

      const result = await repository.findWithFilters({
        role: 'admin',
        page: 1,
        limit: 10,
      });

      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Users',
        FilterExpression: '#role = :role',
        ExpressionAttributeNames: {
          '#role': 'role',
        },
        ExpressionAttributeValues: {
          ':role': 'admin',
        },
      });
      expect(result).toEqual({
        items: mockUsers,
        total: 1,
      });
    });

    it('should find users with active filter', async () => {
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashedPassword',
          phone: '+1234567890',
          role: 'participant',
          emailVerified: true,
          active: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
      ];

      (dynamoDBService.scan as jest.Mock).mockResolvedValueOnce({
        Items: mockUsers,
      });

      const result = await repository.findWithFilters({
        active: true,
        page: 1,
        limit: 10,
      });

      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Users',
        FilterExpression: '#active = :active',
        ExpressionAttributeNames: {
          '#active': 'active',
        },
        ExpressionAttributeValues: {
          ':active': true,
        },
      });
      expect(result).toEqual({
        items: mockUsers,
        total: 1,
      });
    });

    it('should find users with multiple filters', async () => {
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashedPassword',
          phone: '+1234567890',
          role: 'admin',
          emailVerified: true,
          active: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
      ];

      (dynamoDBService.scan as jest.Mock).mockResolvedValueOnce({
        Items: mockUsers,
      });

      const result = await repository.findWithFilters({
        name: 'John',
        role: 'admin',
        active: true,
        page: 1,
        limit: 10,
      });

      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Users',
        FilterExpression: 'contains(#name, :name) AND #role = :role AND #active = :active',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#role': 'role',
          '#active': 'active',
        },
        ExpressionAttributeValues: {
          ':name': 'John',
          ':role': 'admin',
          ':active': true,
        },
      });
      expect(result).toEqual({
        items: mockUsers,
        total: 1,
      });
    });

    it('should handle pagination', async () => {
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'User 1',
          email: 'user1@example.com',
          password: 'hashedPassword',
          phone: '+1234567890',
          role: 'participant',
          emailVerified: true,
          active: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          name: 'User 2',
          email: 'user2@example.com',
          password: 'hashedPassword',
          phone: '+1234567890',
          role: 'participant',
          emailVerified: true,
          active: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
        {
          id: '3',
          name: 'User 3',
          email: 'user3@example.com',
          password: 'hashedPassword',
          phone: '+1234567890',
          role: 'participant',
          emailVerified: true,
          active: true,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z',
        },
      ];

      (dynamoDBService.scan as jest.Mock).mockResolvedValueOnce({
        Items: mockUsers,
      });

      const result = await repository.findWithFilters({
        page: 2,
        limit: 1,
      });

      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Users',
      });
      expect(result).toEqual({
        items: [mockUsers[1]],
        total: 3,
      });
    });
  });
});