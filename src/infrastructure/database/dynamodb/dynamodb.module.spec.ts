import { Test, TestingModule } from '@nestjs/testing';
import { DynamoDBModule } from './dynamodb.module';
import { DynamoDBService } from './dynamodb.service';
import { ConfigModule } from '../../../config/config.module';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb';


const mockDynamoDBClient = {
  send: jest.fn().mockResolvedValue({}),
  config: {},
  middlewareStack: {
    add: jest.fn(),
    addRelativeTo: jest.fn(),
    clone: jest.fn(),
    remove: jest.fn(),
    resolve: jest.fn(),
    use: jest.fn(),
  }
};

jest.mock('@aws-sdk/client-dynamodb', () => {
  return {
    DynamoDBClient: jest.fn().mockImplementation(() => mockDynamoDBClient),
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


jest.mock('@aws-sdk/lib-dynamodb', () => {
  return {
    DynamoDBDocumentClient: {
      from: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue({}),
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

describe('DynamoDBModule', () => {
  let module: TestingModule;
  let dynamoDBService: DynamoDBService;

  beforeEach(async () => {
   
    process.env.NODE_ENV = 'test';
    
    module = await Test.createTestingModule({
      imports: [DynamoDBModule, ConfigModule],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              switch (key) {
                case 'AWS_REGION':
                  return 'us-east-1';
                case 'AWS_ACCESS_KEY_ID':
                  return 'test-key';
                case 'AWS_SECRET_ACCESS_KEY':
                  return 'test-secret';
                default:
                  return undefined;
              }
            })
          }
        }
      ]
    }).compile();

    dynamoDBService = module.get<DynamoDBService>(DynamoDBService);
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(dynamoDBService).toBeDefined();
  });

  describe('onModuleInit', () => {
    it.skip('should create all required tables', async () => {
     
      const dynamoDBModule = module.get<DynamoDBModule>(DynamoDBModule);
      await dynamoDBModule.onModuleInit();
      
      expect(CreateTableCommand).toHaveBeenCalledTimes(3);
      expect(mockDynamoDBClient.send).toHaveBeenCalledTimes(3);
    });

    it.skip('should handle errors when creating tables', async () => {
     
      const dynamoDBModule = module.get<DynamoDBModule>(DynamoDBModule);
      mockDynamoDBClient.send.mockRejectedValueOnce(new Error('Table already exists'));
      
      
      await expect(dynamoDBModule.onModuleInit()).resolves.not.toThrow();
    });
  });
});