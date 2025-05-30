import { Test, TestingModule } from '@nestjs/testing';
import { DynamoDBService } from './dynamodb.service';


jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(),
}));


jest.mock('@aws-sdk/lib-dynamodb', () => {
  const mockSendFn = jest.fn();
  
  return {
    DynamoDBDocumentClient: {
      from: jest.fn().mockReturnValue({ send: mockSendFn }),
    },
    PutCommand: jest.fn(),
    GetCommand: jest.fn(),
    DeleteCommand: jest.fn(),
    ScanCommand: jest.fn(),
    QueryCommand: jest.fn(),
    mockSendFn, 
  };
});


const { mockSendFn, PutCommand, GetCommand, DeleteCommand, ScanCommand, QueryCommand } = jest.requireMock('@aws-sdk/lib-dynamodb');

describe('DynamoDBService', () => {
  let service: DynamoDBService;
  let mockDynamoDBClient: any;

  beforeEach(async () => {
    mockDynamoDBClient = {};
    mockSendFn.mockClear();
    PutCommand.mockClear();
    GetCommand.mockClear();
    DeleteCommand.mockClear();
    ScanCommand.mockClear();
    QueryCommand.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DynamoDBService,
        {
          provide: 'DYNAMODB_CLIENT',
          useValue: mockDynamoDBClient,
        },
      ],
    }).compile();

    service = module.get<DynamoDBService>(DynamoDBService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('put', () => {
    it('should send PutCommand with correct parameters', async () => {
      const params = {
        TableName: 'TestTable',
        Item: { id: '1', name: 'Test Item' },
      };

      mockSendFn.mockResolvedValueOnce({ success: true });

      const result = await service.put(params);

      expect(PutCommand).toHaveBeenCalledWith(params);
      expect(mockSendFn).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('get', () => {
    it('should send GetCommand with correct parameters', async () => {
      const params = {
        TableName: 'TestTable',
        Key: { id: '1' },
      };

      mockSendFn.mockResolvedValueOnce({ Item: { id: '1', name: 'Test Item' } });

      const result = await service.get(params);

      expect(GetCommand).toHaveBeenCalledWith(params);
      expect(mockSendFn).toHaveBeenCalled();
      expect(result).toEqual({ Item: { id: '1', name: 'Test Item' } });
    });
  });

  describe('delete', () => {
    it('should send DeleteCommand with correct parameters', async () => {
      const params = {
        TableName: 'TestTable',
        Key: { id: '1' },
      };

      mockSendFn.mockResolvedValueOnce({ success: true });

      const result = await service.delete(params);

      expect(DeleteCommand).toHaveBeenCalledWith(params);
      expect(mockSendFn).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('scan', () => {
    it('should send ScanCommand with correct parameters', async () => {
      const params = {
        TableName: 'TestTable',
        FilterExpression: 'attribute_exists(id)',
      };

      mockSendFn.mockResolvedValueOnce({ Items: [{ id: '1', name: 'Test Item' }] });

      const result = await service.scan(params);

      expect(ScanCommand).toHaveBeenCalledWith(params);
      expect(mockSendFn).toHaveBeenCalled();
      expect(result).toEqual({ Items: [{ id: '1', name: 'Test Item' }] });
    });
  });

  describe('query', () => {
    it('should send QueryCommand with correct parameters', async () => {
      const params = {
        TableName: 'TestTable',
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: { ':id': '1' },
      };

      mockSendFn.mockResolvedValueOnce({ Items: [{ id: '1', name: 'Test Item' }] });

      const result = await service.query(params);

      expect(QueryCommand).toHaveBeenCalledWith(params);
      expect(mockSendFn).toHaveBeenCalled();
      expect(result).toEqual({ Items: [{ id: '1', name: 'Test Item' }] });
    });
  });
});