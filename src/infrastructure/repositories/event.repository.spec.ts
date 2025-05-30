import { Test, TestingModule } from '@nestjs/testing';
import { EventDynamoDBRepository } from './event.repository';
import { DynamoDBService } from '../database/dynamodb/dynamodb.service';
import { Event } from '../../domain/entities/event.entity';

describe('EventDynamoDBRepository', () => {
  let repository: EventDynamoDBRepository;
  let dynamoDBService: jest.Mocked<DynamoDBService>;

  const mockEvent: Event = {
    id: '1',
    name: 'Test Event',
    description: 'Test Description',
    date: '2025-01-01',
    location: 'Test Location',
    imageUrl: 'test.jpg',
    active: true,
    organizerId: 'org-1',
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
    it('should return events for a specific date', async () => {
      const date = '2025-01-01';
      const mockEvents = [mockEvent];
      
      dynamoDBService.query.mockResolvedValue({ Items: mockEvents, $metadata: {} });

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
      dynamoDBService.query.mockResolvedValue({ Items: [], $metadata: {} });

      const result = await repository.findByDate('2025-01-01');
      
      expect(result).toEqual([]);
    });
  });

  describe('findByName', () => {
    it('should return an event with matching name', async () => {
      dynamoDBService.scan.mockResolvedValue({ Items: [mockEvent], $metadata: {} });

      const result = await repository.findByName('Test Event');
      
      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Events',
        FilterExpression: '#name = :name',
        ExpressionAttributeNames: { '#name': 'name' },
        ExpressionAttributeValues: { ':name': 'Test Event' },
      });
      expect(result).toEqual(mockEvent);
    });

    it('should return null when no event found', async () => {
      dynamoDBService.scan.mockResolvedValue({ Items: [], $metadata: {} });

      const result = await repository.findByName('Non-existent Event');
      
      expect(result).toBeNull();
    });
  });

  describe('findWithFilters', () => {
    it('should filter events by name', async () => {
      dynamoDBService.scan.mockResolvedValue({ Items: [mockEvent], $metadata: {} });

      const result = await repository.findWithFilters({
        name: 'Test',
        page: 1,
        limit: 10,
      });
      
      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Events',
        FilterExpression: 'contains(#name, :name)',
        ExpressionAttributeNames: { '#name': 'name' },
        ExpressionAttributeValues: { ':name': 'Test' },
      });
      expect(result).toEqual({ items: [mockEvent], total: 1 });
    });

    it('should filter events by date range', async () => {
      dynamoDBService.scan.mockResolvedValue({ Items: [mockEvent], $metadata: {} });

      const result = await repository.findWithFilters({
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        page: 1,
        limit: 10,
      });
      
      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Events',
        FilterExpression: '#date >= :startDate AND #date <= :endDate',
        ExpressionAttributeNames: { '#date': 'date' },
        ExpressionAttributeValues: { 
          ':startDate': '2025-01-01',
          ':endDate': '2025-01-31'
        },
      });
      expect(result).toEqual({ items: [mockEvent], total: 1 });
    });

    it('should filter events by active status', async () => {
      dynamoDBService.scan.mockResolvedValue({ Items: [mockEvent], $metadata: {} });

      const result = await repository.findWithFilters({
        active: true,
        page: 1,
        limit: 10,
      });
      
      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'Events',
        FilterExpression: '#active = :active',
        ExpressionAttributeNames: { '#active': 'active' },
        ExpressionAttributeValues: { ':active': true },
      });
      expect(result).toEqual({ items: [mockEvent], total: 1 });
    });

    it('should handle pagination correctly', async () => {
      const mockEvents = Array(15).fill(null).map((_, i) => ({
        ...mockEvent,
        id: `${i + 1}`,
      }));
      
      dynamoDBService.scan.mockResolvedValue({ Items: mockEvents, $metadata: {} });

      const result = await repository.findWithFilters({
        page: 2,
        limit: 5,
      });
      
      expect(result.items.length).toBe(5);
      expect(result.items[0].id).toBe('6');
      expect(result.total).toBe(15);
    });

    it('should return empty result when no filters match', async () => {
      dynamoDBService.scan.mockResolvedValue({ Items: [], $metadata: {} });

      const result = await repository.findWithFilters({
        name: 'Non-existent',
        page: 1,
        limit: 10,
      });
      
      expect(result).toEqual({ items: [], total: 0 });
    });
  });
});