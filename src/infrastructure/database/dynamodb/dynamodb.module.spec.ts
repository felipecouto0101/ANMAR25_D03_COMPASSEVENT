import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DynamoDBModule } from './dynamodb.module';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import * as dynamodbUtils from './dynamodb.utils';

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
}));

jest.mock('./dynamodb.utils', () => ({
  createEventTable: jest.fn().mockResolvedValue(undefined),
  createUserTable: jest.fn().mockResolvedValue(undefined),
  createRegistrationTable: jest.fn().mockResolvedValue(undefined),
}));

describe('DynamoDBModule', () => {
  let module: DynamoDBModule;
  let mockDynamoDBClient: jest.Mocked<DynamoDBClient>;

  beforeEach(async () => {
    mockDynamoDBClient = {
      send: jest.fn(),
    } as any;

    const moduleRef = await Test.createTestingModule({
      providers: [
        DynamoDBModule,
        {
          provide: 'DYNAMODB_CLIENT',
          useValue: mockDynamoDBClient,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'AWS_REGION') return 'us-east-1';
              if (key === 'AWS_ACCESS_KEY_ID') return 'test-key';
              if (key === 'AWS_SECRET_ACCESS_KEY') return 'test-secret';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    module = moduleRef.get<DynamoDBModule>(DynamoDBModule);
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should initialize tables on module init', async () => {
    await module.onModuleInit();
    
    expect(dynamodbUtils.createEventTable).toHaveBeenCalledWith(mockDynamoDBClient);
    expect(dynamodbUtils.createUserTable).toHaveBeenCalledWith(mockDynamoDBClient);
    expect(dynamodbUtils.createRegistrationTable).toHaveBeenCalledWith(mockDynamoDBClient);
  });
});