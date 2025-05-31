import { Test } from '@nestjs/testing';
import { DynamoDBModule } from './dynamodb.module';
import { DynamoDBService } from './dynamodb.service';
import { ConfigModule } from '../../../config/config.module';
import * as utils from './dynamodb.utils';


jest.mock('./dynamodb.utils', () => ({
  createEventTable: jest.fn().mockResolvedValue(undefined),
  createUserTable: jest.fn().mockResolvedValue(undefined),
  createRegistrationTable: jest.fn().mockResolvedValue(undefined),
}));

describe('DynamoDBModule', () => {
  let module;
  let dynamoDBModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [DynamoDBModule, ConfigModule],
      providers: [
        {
          provide: 'DYNAMODB_CLIENT',
          useValue: {
            send: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    dynamoDBModule = module.get(DynamoDBModule);
  });

  it('should be defined', () => {
    expect(DynamoDBModule).toBeDefined();
  });

  it('should provide DynamoDBService', () => {
    const service = module.get(DynamoDBService);
    expect(service).toBeDefined();
  });

  it('should call createEventTable, createUserTable, and createRegistrationTable on module init', async () => {
    await dynamoDBModule.onModuleInit();
    
    expect(utils.createEventTable).toHaveBeenCalled();
    expect(utils.createUserTable).toHaveBeenCalled();
    expect(utils.createRegistrationTable).toHaveBeenCalled();
  });
});