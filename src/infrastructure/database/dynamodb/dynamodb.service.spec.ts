import { Test, TestingModule } from '@nestjs/testing';
import { DynamoDBService } from './dynamodb.service';


const mockPutCommand = jest.fn();
const mockGetCommand = jest.fn();
const mockQueryCommand = jest.fn();
const mockDeleteCommand = jest.fn();
const mockScanCommand = jest.fn();
const mockUpdateCommand = jest.fn();


const mockSend = jest.fn();


jest.mock('@aws-sdk/lib-dynamodb', () => {
  return {
    DynamoDBDocumentClient: {
      from: jest.fn().mockReturnValue({
        send: mockSend
      })
    },
    PutCommand: mockPutCommand,
    GetCommand: mockGetCommand,
    QueryCommand: mockQueryCommand,
    ScanCommand: mockScanCommand,
    DeleteCommand: mockDeleteCommand,
    UpdateCommand: mockUpdateCommand
  };
});

describe('DynamoDBService', () => {
  let service: DynamoDBService;

  beforeEach(async () => {
    
    jest.clearAllMocks();
    
    
    mockSend.mockResolvedValue({ success: true });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DynamoDBService,
        {
          provide: 'DYNAMODB_CLIENT',
          useValue: {
            send: jest.fn().mockResolvedValue({ success: true })
          }
        }
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
        Item: { id: '1', name: 'Test Item' }
      };

      mockSend.mockResolvedValueOnce({ success: true });

      const result = await service.put(params);

      expect(mockPutCommand).toHaveBeenCalledWith(params);
      expect(mockSend).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('get', () => {
    it('should send GetCommand with correct parameters', async () => {
      const params = {
        TableName: 'TestTable',
        Key: { id: '1' }
      };

      mockSend.mockResolvedValueOnce({ Item: { id: '1', name: 'Test Item' } });

      const result = await service.get(params);

      expect(mockGetCommand).toHaveBeenCalledWith(params);
      expect(mockSend).toHaveBeenCalled();
      expect(result).toEqual({ Item: { id: '1', name: 'Test Item' } });
    });
  });

  describe('delete', () => {
    it('should send DeleteCommand with correct parameters', async () => {
      const params = {
        TableName: 'TestTable',
        Key: { id: '1' }
      };

      mockSend.mockResolvedValueOnce({ success: true });

      const result = await service.delete(params);

      expect(mockDeleteCommand).toHaveBeenCalledWith(params);
      expect(mockSend).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('scan', () => {
    it('should send ScanCommand with correct parameters', async () => {
      const params = {
        TableName: 'TestTable',
        FilterExpression: 'attribute_exists(name)'
      };

      mockSend.mockResolvedValueOnce({ Items: [{ id: '1', name: 'Test Item' }] });

      const result = await service.scan(params);

      expect(mockScanCommand).toHaveBeenCalledWith(params);
      expect(mockSend).toHaveBeenCalled();
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

      mockSend.mockResolvedValueOnce({ Items: [{ id: '1', name: 'Test Item' }] });

      const result = await service.query(params);

      expect(mockQueryCommand).toHaveBeenCalledWith(params);
      expect(mockSend).toHaveBeenCalled();
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

      mockSend.mockResolvedValueOnce({ 
        Attributes: { id: '1', name: 'Updated Name' } 
      });

      const result = await service.update(params);

      expect(mockUpdateCommand).toHaveBeenCalledWith(params);
      expect(mockSend).toHaveBeenCalled();
      expect(result).toEqual({ 
        Attributes: { id: '1', name: 'Updated Name' } 
      });
    });
  });
});