import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb';
import { createEventTable, createUserTable, createRegistrationTable } from './dynamodb.utils';


jest.mock('@aws-sdk/client-dynamodb', () => {
  const mockSend = jest.fn();
  return {
    DynamoDBClient: jest.fn().mockImplementation(() => ({
      send: mockSend
    })),
    CreateTableCommand: jest.fn(),
    ScalarAttributeType: {
      S: 'S'
    },
    KeyType: {
      HASH: 'HASH'
    },
    ProjectionType: {
      ALL: 'ALL'
    }
  };
});

describe('DynamoDB Utils', () => {
  let mockDynamoDBClient: jest.Mocked<DynamoDBClient>;
  let mockSend: jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend = jest.fn().mockResolvedValue({});
    (DynamoDBClient as jest.Mock).mockImplementation(() => ({
      send: mockSend
    }));
    mockDynamoDBClient = new DynamoDBClient({}) as jest.Mocked<DynamoDBClient>;
  });

  describe('createEventTable', () => {
    it('should create Events table successfully', async () => {
     
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      

      await createEventTable(mockDynamoDBClient);
      
   
      expect(CreateTableCommand).toHaveBeenCalledWith(expect.objectContaining({
        TableName: 'Events'
      }));
      expect(mockDynamoDBClient.send).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('Events table created successfully');
      
      consoleSpy.mockRestore();
    });

    it('should handle table already exists error', async () => {
     
      const error = new Error('Table already exists');
      error.name = 'ResourceInUseException';
      mockSend.mockRejectedValueOnce(error);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
   
      await createEventTable(mockDynamoDBClient);
      
    
      expect(consoleSpy).toHaveBeenCalledWith('Events table already exists');
      
      consoleSpy.mockRestore();
    });

    it('should handle other errors', async () => {
      
      const error = new Error('Some AWS error');
      mockSend.mockRejectedValueOnce(error);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
   
      await expect(createEventTable(mockDynamoDBClient)).rejects.toThrow('Some AWS error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating Events table:', error);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('createUserTable', () => {
    it('should create Users table successfully', async () => {
     
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
    
      await createUserTable(mockDynamoDBClient);
      
   
      expect(CreateTableCommand).toHaveBeenCalledWith(expect.objectContaining({
        TableName: 'Users'
      }));
      expect(mockDynamoDBClient.send).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('Users table created successfully');
      
      consoleSpy.mockRestore();
    });

    it('should handle table already exists error', async () => {
    
      const error = new Error('Table already exists');
      error.name = 'ResourceInUseException';
      mockSend.mockRejectedValueOnce(error);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
   
      await createUserTable(mockDynamoDBClient);
      
    
      expect(consoleSpy).toHaveBeenCalledWith('Users table already exists');
      
      consoleSpy.mockRestore();
    });

    it('should handle other errors', async () => {
      
      const error = new Error('Some AWS error');
      mockSend.mockRejectedValueOnce(error);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
   
      await expect(createUserTable(mockDynamoDBClient)).rejects.toThrow('Some AWS error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating Users table:', error);
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('createRegistrationTable', () => {
    it('should create Registrations table successfully', async () => {
     
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
   
      await createRegistrationTable(mockDynamoDBClient);
      
     
      expect(CreateTableCommand).toHaveBeenCalledWith(expect.objectContaining({
        TableName: 'Registrations'
      }));
      expect(mockDynamoDBClient.send).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('Registrations table created successfully');
      
      consoleSpy.mockRestore();
    });

    it('should handle table already exists error', async () => {
     
      const error = new Error('Table already exists');
      error.name = 'ResourceInUseException';
      mockSend.mockRejectedValueOnce(error);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
    
      await createRegistrationTable(mockDynamoDBClient);
      
    
      expect(consoleSpy).toHaveBeenCalledWith('Registrations table already exists');
      
      consoleSpy.mockRestore();
    });

    it('should handle other errors', async () => {
      
      const error = new Error('Some AWS error');
      mockSend.mockRejectedValueOnce(error);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
   
      await expect(createRegistrationTable(mockDynamoDBClient)).rejects.toThrow('Some AWS error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating Registrations table:', error);
      
      consoleErrorSpy.mockRestore();
    });
  });
});