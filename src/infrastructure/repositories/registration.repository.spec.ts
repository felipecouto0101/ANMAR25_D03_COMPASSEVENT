import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationDynamoDBRepository } from './registration.repository';
import { DynamoDBService } from '../database/dynamodb/dynamodb.service';
import { Registration } from '../../domain/entities/registration.entity';

describe('RegistrationDynamoDBRepository', () => {
  let repository: RegistrationDynamoDBRepository;
  let dynamoDBService: jest.Mocked<DynamoDBService>;

  const mockRegistration: Registration = {
    id: '1',
    eventId: 'event-1',
    userId: 'user-1',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    const mockDynamoDBService = {
      put: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
      scan: jest.fn(),
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationDynamoDBRepository,
        {
          provide: DynamoDBService,
          useValue: mockDynamoDBService,
        },
      ],
    }).compile();

    repository = module.get<RegistrationDynamoDBRepository>(RegistrationDynamoDBRepository);
    dynamoDBService = module.get(DynamoDBService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByUserAndEvent', () => {
    it('should return registration for specific user and event', async () => {
      dynamoDBService.scan.mockResolvedValue({ Items: [mockRegistration], $metadata: {} });

      const result = await repository.findByUserAndEvent('user-1', 'event-1');
      
      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Registrations',
        FilterExpression: '#userId = :userId AND #eventId = :eventId',
        ExpressionAttributeNames: {
          '#userId': 'userId',
          '#eventId': 'eventId',
        },
        ExpressionAttributeValues: {
          ':userId': 'user-1',
          ':eventId': 'event-1',
        },
      });
      expect(result).toEqual(mockRegistration);
    });

    it('should return null when no registration found', async () => {
      dynamoDBService.scan.mockResolvedValue({ Items: [], $metadata: {} });

      const result = await repository.findByUserAndEvent('user-1', 'event-1');
      
      expect(result).toBeNull();
    });
  });

  describe('findByUser', () => {
    it('should return registrations for a specific user with pagination', async () => {
      const mockRegistrations = [
        mockRegistration,
        { ...mockRegistration, id: '2', eventId: 'event-2' },
      ];
      
      dynamoDBService.scan.mockResolvedValue({ Items: mockRegistrations, $metadata: {} });

      const result = await repository.findByUser('user-1', 1, 10);
      
      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Registrations',
        FilterExpression: '#userId = :userId AND #active = :active',
        ExpressionAttributeNames: {
          '#userId': 'userId',
          '#active': 'active',
        },
        ExpressionAttributeValues: {
          ':userId': 'user-1',
          ':active': true,
        },
      });
      expect(result).toEqual({
        items: mockRegistrations,
        total: 2,
      });
    });

    it('should handle pagination correctly', async () => {
      const mockRegistrations = Array(15).fill(null).map((_, i) => ({
        ...mockRegistration,
        id: `${i + 1}`,
        eventId: `event-${i + 1}`,
      }));
      
      dynamoDBService.scan.mockResolvedValue({ Items: mockRegistrations, $metadata: {} });

      const result = await repository.findByUser('user-1', 2, 5);
      
      expect(result.items.length).toBe(5);
      expect(result.items[0].id).toBe('6');
      expect(result.total).toBe(15);
    });

    it('should return empty result when no registrations found', async () => {
      dynamoDBService.scan.mockResolvedValue({ Items: [], $metadata: {} });

      const result = await repository.findByUser('user-1', 1, 10);
      
      expect(result).toEqual({
        items: [],
        total: 0,
      });
    });
  });
});