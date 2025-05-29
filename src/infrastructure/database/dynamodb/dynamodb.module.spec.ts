
jest.mock('@aws-sdk/lib-dynamodb', () => {
  return {
    DynamoDBDocumentClient: {
      from: jest.fn().mockReturnValue({ send: jest.fn() }),
    },
  };
});

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('./dynamodb.utils', () => ({
  createEventTable: jest.fn().mockResolvedValue(undefined),
  createUserTable: jest.fn().mockResolvedValue(undefined),
  createRegistrationTable: jest.fn().mockResolvedValue(undefined),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DynamoDBModule } from './dynamodb.module';
import { DynamoDBService } from './dynamodb.service';

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('./dynamodb.utils', () => ({
  createEventTable: jest.fn().mockResolvedValue(undefined),
  createUserTable: jest.fn().mockResolvedValue(undefined),
  createRegistrationTable: jest.fn().mockResolvedValue(undefined),
}));

describe('DynamoDBModule', () => {
  it('should be defined', async () => {
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: 'DYNAMODB_CLIENT',
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-value'),
          },
        },
        DynamoDBService,
      ],
    }).compile();

    const service = module.get<DynamoDBService>(DynamoDBService);
    expect(service).toBeDefined();
  });
});