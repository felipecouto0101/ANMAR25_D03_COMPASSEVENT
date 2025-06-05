import { Test, TestingModule } from '@nestjs/testing';
import { DynamoDBService } from './dynamodb.service';
import { 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  DeleteCommand, 
  ScanCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';


jest.mock('@aws-sdk/lib-dynamodb', () => {
  const mockSend = jest.fn().mockResolvedValue({ success: true });
  
  return {
    DynamoDBDocumentClient: {
      from: jest.fn().mockReturnValue({
        send: mockSend
      })
    },
    PutCommand: jest.fn(),
    GetCommand: jest.fn(),
    QueryCommand: jest.fn(),
    ScanCommand: jest.fn(),
    DeleteCommand: jest.fn(),
    UpdateCommand: jest.fn()
  };
});

describe('DynamoDBService', () => {
  let service: DynamoDBService;
  let mockDynamoDBClient: any;
  let mockDocClient: any;
  let mockSendFn: jest.Mock;

  beforeEach(async () => {
    
    mockSendFn = jest.fn().mockResolvedValue({ success: true });
    mockDocClient = {
      send: mockSendFn
    };
    
    mockDynamoDBClient = {
      send: jest.fn().mockResolvedValue({ success: true })
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DynamoDBService,
        {
          provide: 'DYNAMODB_CLIENT',
          useValue: mockDynamoDBClient
        }
      ],
    }).compile();

    service = module.get<DynamoDBService>(DynamoDBService);
    
    
    (service as any).docClient = mockDocClient;
    
   
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('put', () => {
    it('should send PutCommand with correct parameters', async () => {
      const params = {
        TableName: 'TestTable',
        Item: { id: '1', name: 'Test Item' }
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
        Key: { id: '1' }
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
        Key: { id: '1' }
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
        FilterExpression: 'attribute_exists(name)'
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
        ExpressionAttributeValues: { ':id': '1' }
      };

      mockSendFn.mockResolvedValueOnce({ Items: [{ id: '1', name: 'Test Item' }] });

      const result = await service.query(params);

      expect(QueryCommand).toHaveBeenCalledWith(params);
      expect(mockSendFn).toHaveBeenCalled();
      expect(result).toEqual({ Items: [{ id: '1', name: 'Test Item' }] });
    });
  });

  describe('update', () => {
    it('should send UpdateCommand with correct parameters', async () => {
      const params = {
        TableName: 'TestTable',
        Key: { id: '1' },
        UpdateExpression: 'set #name = :name',
        ExpressionAttributeNames: { '#name': 'name' },
        ExpressionAttributeValues: { ':name': 'Updated Name' },
        ReturnValues: 'ALL_NEW' as const
      };

      mockSendFn.mockResolvedValueOnce({ 
        Attributes: { id: '1', name: 'Updated Name' } 
      });

      const result = await service.update(params);

      expect(UpdateCommand).toHaveBeenCalledWith(params);
      expect(mockSendFn).toHaveBeenCalled();
      expect(result).toEqual({ 
        Attributes: { id: '1', name: 'Updated Name' } 
      });
    });
  });
});