
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ Location: 'https://test-bucket.s3.amazonaws.com/test-key' })
  })),
  PutObjectCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({})
  })),
  SendEmailCommand: jest.fn(),
  ListVerifiedEmailAddressesCommand: jest.fn().mockImplementation(() => ({
    VerifiedEmailAddresses: ['test@example.com']
  }))
}));

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({})
  })),
  CreateTableCommand: jest.fn(),
  ScanCommand: jest.fn(),
  PutItemCommand: jest.fn(),
  GetItemCommand: jest.fn(),
  UpdateItemCommand: jest.fn(),
  DeleteItemCommand: jest.fn(),
  QueryCommand: jest.fn()
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockImplementation((command) => {
        if (command.constructor.name === 'ScanCommand') {
          return Promise.resolve({ Items: [] });
        }
        if (command.constructor.name === 'QueryCommand') {
          return Promise.resolve({ Items: [] });
        }
        if (command.constructor.name === 'GetItemCommand') {
          return Promise.resolve({ Item: null });
        }
        if (command.constructor.name === 'PutItemCommand') {
          return Promise.resolve({});
        }
        if (command.constructor.name === 'UpdateItemCommand') {
          return Promise.resolve({});
        }
        if (command.constructor.name === 'DeleteItemCommand') {
          return Promise.resolve({});
        }
        return Promise.resolve({});
      })
    }))
  },
  ScanCommand: jest.fn(),
  QueryCommand: jest.fn(),
  GetCommand: jest.fn(),
  PutCommand: jest.fn(),
  UpdateCommand: jest.fn(),
  DeleteCommand: jest.fn()
}));


jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true)
}));


jest.mock('ical-generator', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      createEvent: jest.fn().mockReturnThis(),
      toString: jest.fn().mockReturnValue('test-ical')
    }))
  };
});


global.crypto = {
  getRandomValues: arr => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
  subtle: {
    digest: () => Promise.resolve(new ArrayBuffer(32))
  },
  randomUUID: () => 'test-uuid'
};


jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid')
}));