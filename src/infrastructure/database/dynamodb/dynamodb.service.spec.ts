import { Test, TestingModule } from '@nestjs/testing';
import { DynamoDBService } from './dynamodb.service';


jest.mock('@aws-sdk/lib-dynamodb', () => {
  return {
    DynamoDBDocumentClient: {
      from: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue({ success: true })
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

  beforeEach(async () => {
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
});