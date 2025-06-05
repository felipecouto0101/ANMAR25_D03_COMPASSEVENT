
process.env.NODE_ENV = 'test';


process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test-key-id';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.AWS_SESSION_TOKEN = 'test-session-token';
process.env.AWS_S3_BUCKET_NAME = 'test-bucket';


process.env.DEFAULT_ADMIN_NAME = 'Admin';
process.env.DEFAULT_ADMIN_EMAIL = 'admin@admin.com';
process.env.DEFAULT_ADMIN_PASSWORD = 'Admin@1012';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRATION = '24h';


const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE2MTYyMjIyLCJleHAiOjk5OTk5OTk5OTl9.mock-signature';


jest.mock('@aws-sdk/client-dynamodb', () => {
  const mockSend = jest.fn().mockResolvedValue({});
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

jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn().mockResolvedValue({});
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockSend
    })),
    PutObjectCommand: jest.fn()
  };
});

jest.mock('@aws-sdk/client-ses', () => {
  const mockSend = jest.fn().mockResolvedValue({});
  return {
    SESClient: jest.fn().mockImplementation(() => ({
      send: mockSend
    })),
    SendEmailCommand: jest.fn(),
    ListVerifiedEmailAddressesCommand: jest.fn()
  };
});

jest.mock('@aws-sdk/lib-dynamodb', () => {
  return {
    DynamoDBDocumentClient: {
      from: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue({})
      })
    },
    QueryCommand: jest.fn(),
    PutCommand: jest.fn(),
    GetCommand: jest.fn(),
    UpdateCommand: jest.fn(),
    DeleteCommand: jest.fn(),
    ScanCommand: jest.fn()
  };
});


jest.mock('@nestjs/jwt', () => {
  return {
    JwtModule: {
      register: jest.fn().mockReturnValue({}),
      registerAsync: jest.fn().mockReturnValue({})
    },
    JwtService: jest.fn().mockImplementation(() => ({
      sign: jest.fn().mockReturnValue(mockJwtToken),
      verify: jest.fn().mockReturnValue({
        sub: 'test-user-id',
        email: 'admin@example.com',
        role: 'admin'
      })
    }))
  };
});


jest.mock('@nestjs/passport', () => {
 
  class MockAuthGuard {
    constructor(strategy) {
      this.strategy = strategy;
    }
    
    canActivate() {
      return true;
    }
  }
  
 
  const mockAuthGuard = jest.fn().mockImplementation((strategy) => {
    return MockAuthGuard;
  });
  
 
  const mockPassportStrategy = (Strategy) => {
    return class MockStrategy {
      constructor() {}
      validate() {
        return { 
          userId: 'test-user-id', 
          email: 'admin@example.com', 
          role: 'admin' 
        };
      }
    };
  };
  
  return {
    PassportModule: {
      register: jest.fn().mockReturnValue({})
    },
    PassportStrategy: mockPassportStrategy,
    AuthGuard: mockAuthGuard
  };
});


jest.mock('passport-jwt', () => {
  return {
    Strategy: jest.fn()
  };
});