import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from './database.module';

jest.mock('./dynamodb/dynamodb.module', () => {
  const DynamoDBModuleMock = function() {};
  DynamoDBModuleMock.register = jest.fn().mockReturnValue({
    module: DynamoDBModuleMock,
    providers: [],
    exports: [],
  });
  
  return {
    DynamoDBModule: DynamoDBModuleMock,
  };
});


describe('DatabaseModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });
});