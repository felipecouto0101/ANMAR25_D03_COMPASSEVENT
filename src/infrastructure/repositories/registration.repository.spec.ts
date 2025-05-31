import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationDynamoDBRepository } from './registration.repository';
import { DynamoDBService } from '../database/dynamodb/dynamodb.service';
import { Registration } from '../../domain/entities/registration.entity';


const createMockResponse = (items: any[] = []) => ({
  $metadata: {},
  Items: items
});

describe('RegistrationDynamoDBRepository', () => {
  let repository: RegistrationDynamoDBRepository;
  let dynamoDBService: jest.Mocked<DynamoDBService>;

  const mockRegistration: Registration = {
    id: 'registration-id',
    userId: 'user-id',
    eventId: 'event-id',
    active: true,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
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
    it('should find registration by user and event', async () => {
      dynamoDBService.scan.mockResolvedValueOnce(createMockResponse([mockRegistration]));

      const result = await repository.findByUserAndEvent('user-id', 'event-id');

      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Registrations',
        FilterExpression: '#userId = :userId AND #eventId = :eventId',
        ExpressionAttributeNames: {
          '#userId': 'userId',
          '#eventId': 'eventId',
        },
        ExpressionAttributeValues: {
          ':userId': 'user-id',
          ':eventId': 'event-id',
        },
      });

      expect(result).toEqual(mockRegistration);
    });

    it('should return null when no registration found', async () => {
      dynamoDBService.scan.mockResolvedValueOnce(createMockResponse([]));

      const result = await repository.findByUserAndEvent('user-id', 'event-id');

      expect(result).toBeNull();
    });
  });

  describe('findByUser', () => {
    it('should find registrations by user', async () => {
      dynamoDBService.scan.mockResolvedValueOnce(createMockResponse([mockRegistration]));

      const result = await repository.findByUser('user-id', 1, 10);

      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Registrations',
        FilterExpression: '#userId = :userId AND #active = :active',
        ExpressionAttributeNames: {
          '#userId': 'userId',
          '#active': 'active',
        },
        ExpressionAttributeValues: {
          ':userId': 'user-id',
          ':active': true,
        },
      });

      expect(result).toEqual({
        items: [mockRegistration],
        total: 1,
      });
    });
  });

  describe('findByEventOrganizer', () => {
    it('should find all active registrations', async () => {
      dynamoDBService.scan.mockResolvedValueOnce(createMockResponse([mockRegistration]));

      const result = await repository.findByEventOrganizer('organizer-id', 1, 10);

      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Registrations',
        FilterExpression: '#active = :active',
        ExpressionAttributeNames: {
          '#active': 'active',
        },
        ExpressionAttributeValues: {
          ':active': true,
        },
      });

      expect(result).toEqual({
        items: [mockRegistration],
        total: 1,
      });
    });

    it('should handle pagination correctly', async () => {
      const mockRegistrations = Array(15).fill(null).map((_, i) => ({
        ...mockRegistration,
        id: `registration-id-${i}`,
      }));

      dynamoDBService.scan.mockResolvedValueOnce(createMockResponse(mockRegistrations));

      const result = await repository.findByEventOrganizer('organizer-id', 2, 5);

      expect(result.items.length).toBe(5);
      expect(result.items[0].id).toBe('registration-id-5');
      expect(result.total).toBe(15);
    });
  });
});