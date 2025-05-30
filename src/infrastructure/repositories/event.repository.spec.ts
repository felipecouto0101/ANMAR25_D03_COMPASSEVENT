import { Test, TestingModule } from '@nestjs/testing';
import { EventDynamoDBRepository } from './event.repository';
import { DynamoDBService } from '../database/dynamodb/dynamodb.service';
import { Event } from '../../domain/entities/event.entity';


const createMockResponse = (items: any[] = []) => ({
  $metadata: {},
  Items: items
});

describe('EventDynamoDBRepository', () => {
  let repository: EventDynamoDBRepository;
  let dynamoDBService: jest.Mocked<DynamoDBService>;

  const mockEvent: Event = {
    id: 'event-id',
    name: 'Test Event',
    description: 'Test Description',
    date: '2023-01-01T00:00:00.000Z',
    location: 'Test Location',
    imageUrl: 'https://example.com/image.jpg',
    organizerId: 'user-id',
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
        EventDynamoDBRepository,
        {
          provide: DynamoDBService,
          useValue: mockDynamoDBService,
        },
      ],
    }).compile();

    repository = module.get<EventDynamoDBRepository>(EventDynamoDBRepository);
    dynamoDBService = module.get(DynamoDBService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByDate', () => {
    it('should find events by date', async () => {
      const date = '2023-01-01T00:00:00.000Z';
      const mockEvents = [mockEvent];
      
      dynamoDBService.query.mockResolvedValue(createMockResponse(mockEvents));

      const result = await repository.findByDate(date);
      
      expect(dynamoDBService.query).toHaveBeenCalledWith({
        TableName: 'Events',
        IndexName: 'DateIndex',
        KeyConditionExpression: '#date = :date',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: { ':date': date },
      });
      
      expect(result).toEqual(mockEvents);
    });

    it('should return empty array when no events found', async () => {
      dynamoDBService.query.mockResolvedValue(createMockResponse());

      const result = await repository.findByDate('2023-01-01T00:00:00.000Z');
      
      expect(result).toEqual([]);
    });
  });

  describe('findByName', () => {
    it('should find event by name', async () => {
      const name = 'Test Event';
      
      dynamoDBService.scan.mockResolvedValue(createMockResponse([mockEvent]));

      const result = await repository.findByName(name);
      
      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Events',
        FilterExpression: '#name = :name',
        ExpressionAttributeNames: { '#name': 'name' },
        ExpressionAttributeValues: { ':name': name },
      });
      
      expect(result).toEqual(mockEvent);
    });

    it('should return null when no event found', async () => {
      dynamoDBService.scan.mockResolvedValue(createMockResponse([]));

      const result = await repository.findByName('Non-existent Event');
      
      expect(result).toBeNull();
    });
  });

  describe('findWithFilters', () => {
    it('should find events with name filter', async () => {
      const filters = {
        name: 'Test',
        page: 1,
        limit: 10,
      };
      
      dynamoDBService.scan.mockResolvedValue(createMockResponse([mockEvent]));

      const result = await repository.findWithFilters(filters);
      
      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Events',
        FilterExpression: 'contains(#name, :name)',
        ExpressionAttributeNames: { '#name': 'name' },
        ExpressionAttributeValues: { ':name': 'Test' },
      });
      
      expect(result).toEqual({
        items: [mockEvent],
        total: 1,
      });
    });

    it('should find events with date filters', async () => {
      const filters = {
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2023-12-31T23:59:59.999Z',
        page: 1,
        limit: 10,
      };
      
      dynamoDBService.scan.mockResolvedValue(createMockResponse([mockEvent]));

      const result = await repository.findWithFilters(filters);
      
      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Events',
        FilterExpression: '#date >= :startDate AND #date <= :endDate',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: { 
          ':startDate': '2023-01-01T00:00:00.000Z',
          ':endDate': '2023-12-31T23:59:59.999Z'
        },
      });
      
      expect(result).toEqual({
        items: [mockEvent],
        total: 1,
      });
    });

    it('should find events with active filter', async () => {
      const filters = {
        active: true,
        page: 1,
        limit: 10,
      };
      
      dynamoDBService.scan.mockResolvedValue(createMockResponse([mockEvent]));

      const result = await repository.findWithFilters(filters);
      
      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Events',
        FilterExpression: '#active = :active',
        ExpressionAttributeNames: { '#active': 'active' },
        ExpressionAttributeValues: { ':active': true },
      });
      
      expect(result).toEqual({
        items: [mockEvent],
        total: 1,
      });
    });

    it('should find events with all filters', async () => {
      const filters = {
        name: 'Test',
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2023-12-31T23:59:59.999Z',
        active: true,
        page: 1,
        limit: 10,
      };
      
      dynamoDBService.scan.mockResolvedValue(createMockResponse([mockEvent]));

      const result = await repository.findWithFilters(filters);
      
      expect(dynamoDBService.scan).toHaveBeenCalled();
      expect(result).toEqual({
        items: [mockEvent],
        total: 1,
      });
    });

    it('should handle pagination correctly', async () => {
      const mockEvents = Array(15).fill(null).map((_, i) => ({
        ...mockEvent,
        id: `event-id-${i}`,
      }));
      
      const filters = {
        page: 2,
        limit: 5,
      };
      
      dynamoDBService.scan.mockResolvedValue(createMockResponse(mockEvents));

      const result = await repository.findWithFilters(filters);
      
      expect(result.items.length).toBe(5);
      expect(result.items[0].id).toBe('event-id-5');
      expect(result.total).toBe(15);
    });

    it('should handle no filters', async () => {
      const filters = {
        page: 1,
        limit: 10,
      };
      
      dynamoDBService.scan.mockResolvedValue(createMockResponse([mockEvent]));

      const result = await repository.findWithFilters(filters);
      
      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Events',
      });
      
      expect(result).toEqual({
        items: [mockEvent],
        total: 1,
      });
    });
  });
});