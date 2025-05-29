import { Test, TestingModule } from '@nestjs/testing';
import { DynamoDBService } from './dynamodb.service';
import { 
  PutCommand, 
  GetCommand, 
  DeleteCommand, 
  ScanCommand, 
  QueryCommand 
} from '@aws-sdk/lib-dynamodb';

const mockSend = jest.fn();

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({ send: mockSend }),
  },
  PutCommand: jest.fn(),
  GetCommand: jest.fn(),
  DeleteCommand: jest.fn(),
  ScanCommand: jest.fn(),
  QueryCommand: jest.fn(),
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(),
}));


describe('DynamoDBService', () => {
  let service: DynamoDBService;
  let mockDynamoDBClient: any;

  beforeEach(async () => {
    mockDynamoDBClient = {};
    mockSend.mockClear();

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

      mockSend.mockResolvedValueOnce({ success: true });

      const result = await service.put(params);

      expect(PutCommand).toHaveBeenCalledWith(params);
      expect(mockSend).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('get', () => {
    it('should send GetCommand with correct parameters', async () => {
      const params = {
        TableName: 'TestTable',
        Key: { id: '1' },
      };

      mockSend.mockResolvedValueOnce({ Item: { id: '1', name: 'Test Item' } });

      const result = await service.get(params);

      expect(GetCommand).toHaveBeenCalledWith(params);
      expect(mockSend).toHaveBeenCalled();
      expect(result).toEqual({ Item: { id: '1', name: 'Test Item' } });
    });
  });

  describe('delete', () => {
    it('should send DeleteCommand with correct parameters', async () => {
      const params = {
        TableName: 'TestTable',
        Key: { id: '1' },
      };

      mockSend.mockResolvedValueOnce({ success: true });

      const result = await service.delete(params);

      expect(DeleteCommand).toHaveBeenCalledWith(params);
      expect(mockSend).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('scan', () => {
    it('should send ScanCommand with correct parameters', async () => {
      const params = {
        TableName: 'TestTable',
        FilterExpression: 'attribute_exists(id)',
      };

      mockSend.mockResolvedValueOnce({ Items: [{ id: '1', name: 'Test Item' }] });

      const result = await service.scan(params);

      expect(ScanCommand).toHaveBeenCalledWith(params);
      expect(mockSend).toHaveBeenCalled();
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

      mockSend.mockResolvedValueOnce({ Items: [{ id: '1', name: 'Test Item' }] });

      const result = await service.query(params);

      expect(QueryCommand).toHaveBeenCalledWith(params);
      expect(mockSend).toHaveBeenCalled();
      expect(result).toEqual({ Items: [{ id: '1', name: 'Test Item' }] });
    });
  });
});