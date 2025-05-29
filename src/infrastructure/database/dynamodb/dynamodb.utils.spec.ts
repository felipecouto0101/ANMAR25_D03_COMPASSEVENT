import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb';
import { createEventTable, createUserTable, createRegistrationTable } from './dynamodb.utils';

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(),
  CreateTableCommand: jest.fn(),
  ScalarAttributeType: {
    S: 'S',
  },
  KeyType: {
    HASH: 'HASH',
  },
  ProjectionType: {
    ALL: 'ALL',
  },
}));

describe('DynamoDB Utils', () => {
  let mockDynamoDBClient: any;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockDynamoDBClient = {
      send: jest.fn(),
    };

    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createEventTable', () => {
    it('should create Events table with correct parameters', async () => {
      mockDynamoDBClient.send.mockResolvedValueOnce({});

      await createEventTable(mockDynamoDBClient);

      expect(CreateTableCommand).toHaveBeenCalledWith(expect.objectContaining({
        TableName: 'Events',
        KeySchema: expect.arrayContaining([
          expect.objectContaining({ AttributeName: 'id', KeyType: 'HASH' }),
        ]),
        AttributeDefinitions: expect.arrayContaining([
          expect.objectContaining({ AttributeName: 'id', AttributeType: 'S' }),
          expect.objectContaining({ AttributeName: 'date', AttributeType: 'S' }),
        ]),
        GlobalSecondaryIndexes: expect.arrayContaining([
          expect.objectContaining({
            IndexName: 'DateIndex',
            KeySchema: expect.arrayContaining([
              expect.objectContaining({ AttributeName: 'date', KeyType: 'HASH' }),
            ]),
          }),
        ]),
      }));

      expect(mockDynamoDBClient.send).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Events table created successfully');
    });

    it('should handle ResourceInUseException', async () => {
      const error = new Error('Table already exists');
      error.name = 'ResourceInUseException';
      mockDynamoDBClient.send.mockRejectedValueOnce(error);

      await createEventTable(mockDynamoDBClient);

      expect(consoleSpy).toHaveBeenCalledWith('Events table already exists');
    });

    it('should throw other errors', async () => {
      const error = new Error('Unknown error');
      mockDynamoDBClient.send.mockRejectedValueOnce(error);

      await expect(createEventTable(mockDynamoDBClient)).rejects.toThrow('Unknown error');
    });
  });

  describe('createUserTable', () => {
    it('should create Users table with correct parameters', async () => {
      mockDynamoDBClient.send.mockResolvedValueOnce({});

      await createUserTable(mockDynamoDBClient);

      expect(CreateTableCommand).toHaveBeenCalledWith(expect.objectContaining({
        TableName: 'Users',
        KeySchema: expect.arrayContaining([
          expect.objectContaining({ AttributeName: 'id', KeyType: 'HASH' }),
        ]),
        AttributeDefinitions: expect.arrayContaining([
          expect.objectContaining({ AttributeName: 'id', AttributeType: 'S' }),
          expect.objectContaining({ AttributeName: 'email', AttributeType: 'S' }),
        ]),
        GlobalSecondaryIndexes: expect.arrayContaining([
          expect.objectContaining({
            IndexName: 'EmailIndex',
            KeySchema: expect.arrayContaining([
              expect.objectContaining({ AttributeName: 'email', KeyType: 'HASH' }),
            ]),
          }),
        ]),
      }));

      expect(mockDynamoDBClient.send).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Users table created successfully');
    });

    it('should handle ResourceInUseException', async () => {
      const error = new Error('Table already exists');
      error.name = 'ResourceInUseException';
      mockDynamoDBClient.send.mockRejectedValueOnce(error);

      await createUserTable(mockDynamoDBClient);

      expect(consoleSpy).toHaveBeenCalledWith('Users table already exists');
    });

    it('should throw other errors', async () => {
      const error = new Error('Unknown error');
      mockDynamoDBClient.send.mockRejectedValueOnce(error);

      await expect(createUserTable(mockDynamoDBClient)).rejects.toThrow('Unknown error');
    });
  });

  describe('createRegistrationTable', () => {
    it('should create Registrations table with correct parameters', async () => {
      mockDynamoDBClient.send.mockResolvedValueOnce({});

      await createRegistrationTable(mockDynamoDBClient);

      expect(CreateTableCommand).toHaveBeenCalledWith(expect.objectContaining({
        TableName: 'Registrations',
        KeySchema: expect.arrayContaining([
          expect.objectContaining({ AttributeName: 'id', KeyType: 'HASH' }),
        ]),
        AttributeDefinitions: expect.arrayContaining([
          expect.objectContaining({ AttributeName: 'id', AttributeType: 'S' }),
          expect.objectContaining({ AttributeName: 'userId', AttributeType: 'S' }),
          expect.objectContaining({ AttributeName: 'eventId', AttributeType: 'S' }),
        ]),
        GlobalSecondaryIndexes: expect.arrayContaining([
          expect.objectContaining({
            IndexName: 'UserIdIndex',
            KeySchema: expect.arrayContaining([
              expect.objectContaining({ AttributeName: 'userId', KeyType: 'HASH' }),
            ]),
          }),
          expect.objectContaining({
            IndexName: 'EventIdIndex',
            KeySchema: expect.arrayContaining([
              expect.objectContaining({ AttributeName: 'eventId', KeyType: 'HASH' }),
            ]),
          }),
        ]),
      }));

      expect(mockDynamoDBClient.send).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Registrations table created successfully');
    });

    it('should handle ResourceInUseException', async () => {
      const error = new Error('Table already exists');
      error.name = 'ResourceInUseException';
      mockDynamoDBClient.send.mockRejectedValueOnce(error);

      await createRegistrationTable(mockDynamoDBClient);

      expect(consoleSpy).toHaveBeenCalledWith('Registrations table already exists');
    });

    it('should throw other errors', async () => {
      const error = new Error('Unknown error');
      mockDynamoDBClient.send.mockRejectedValueOnce(error);

      await expect(createRegistrationTable(mockDynamoDBClient)).rejects.toThrow('Unknown error');
    });
  });
});