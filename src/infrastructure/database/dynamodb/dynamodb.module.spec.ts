import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBModule } from './dynamodb.module';
import { DynamoDBService } from './dynamodb.service';
import * as dynamodbUtils from './dynamodb.utils';


jest.mock('@aws-sdk/client-dynamodb', () => {
  return {
    DynamoDBClient: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({})
    }))
  };
});


jest.mock('./dynamodb.utils', () => ({
  createEventTable: jest.fn().mockResolvedValue(undefined),
  createUserTable: jest.fn().mockResolvedValue(undefined),
  createRegistrationTable: jest.fn().mockResolvedValue(undefined)
}));

describe('DynamoDBModule', () => {
  let module: TestingModule;
  let dynamoDBModule: DynamoDBModule;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'AWS_REGION': return 'us-east-1';
          case 'AWS_ACCESS_KEY_ID': return 'test-key';
          case 'AWS_SECRET_ACCESS_KEY': return 'test-secret';
          case 'AWS_SESSION_TOKEN': return 'test-token';
          default: return undefined;
        }
      })
    };

    module = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService
        },
        {
          provide: 'DYNAMODB_CLIENT',
          useFactory: () => new DynamoDBClient({}),
        },
        DynamoDBService,
        DynamoDBModule
      ],
    }).compile();

    dynamoDBModule = module.get<DynamoDBModule>(DynamoDBModule);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(dynamoDBModule).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should create all required tables', async () => {
    
      await dynamoDBModule.onModuleInit();

   
      expect(dynamodbUtils.createEventTable).toHaveBeenCalledTimes(1);
      expect(dynamodbUtils.createUserTable).toHaveBeenCalledTimes(1);
      expect(dynamodbUtils.createRegistrationTable).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when creating tables', async () => {
   
      const error = new Error('Failed to create table');
      (dynamodbUtils.createEventTable as jest.Mock).mockRejectedValueOnce(error);
      
     
      await expect(dynamoDBModule.onModuleInit()).rejects.toThrow('Failed to create table');
    });
  });
});