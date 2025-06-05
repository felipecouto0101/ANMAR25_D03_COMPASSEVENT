// Set environment to test
process.env.NODE_ENV = 'test';

// Mock AWS credentials for tests
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test-key-id';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.AWS_SESSION_TOKEN = 'test-session-token';
process.env.AWS_S3_BUCKET_NAME = 'test-bucket';

// Mock other environment variables
process.env.DEFAULT_ADMIN_NAME = 'Admin';
process.env.DEFAULT_ADMIN_EMAIL = 'admin@admin.com';
process.env.DEFAULT_ADMIN_PASSWORD = 'Admin@1012';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRATION = '24h';

// Mock token for tests
const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE2MTYyMjIyLCJleHAiOjk5OTk5OTk5OTl9.mock-signature';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-dynamodb', () => {
  const mockSend = jest.fn().mockResolvedValue({});
  return {
    DynamoDBClient: jest.fn().mockImplementation(() => ({
      send: mockSend,
      config: {},
      middlewareStack: {
        add: jest.fn(),
        addRelativeTo: jest.fn(),
        clone: jest.fn(),
        remove: jest.fn(),
        resolve: jest.fn(),
        use: jest.fn(),
      }
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
      send: mockSend,
      config: {},
      middlewareStack: {
        add: jest.fn(),
        addRelativeTo: jest.fn(),
        clone: jest.fn(),
        remove: jest.fn(),
        resolve: jest.fn(),
        use: jest.fn(),
      }
    })),
    PutObjectCommand: jest.fn()
  };
});

jest.mock('@aws-sdk/client-ses', () => {
  const mockSend = jest.fn().mockResolvedValue({});
  return {
    SESClient: jest.fn().mockImplementation(() => ({
      send: mockSend,
      config: {},
      middlewareStack: {
        add: jest.fn(),
        addRelativeTo: jest.fn(),
        clone: jest.fn(),
        remove: jest.fn(),
        resolve: jest.fn(),
        use: jest.fn(),
      }
    })),
    SendEmailCommand: jest.fn(),
    ListVerifiedEmailAddressesCommand: jest.fn()
  };
});

jest.mock('@aws-sdk/lib-dynamodb', () => {
  return {
    DynamoDBDocumentClient: {
      from: jest.fn().mockReturnValue({
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

// Mock NestJS JWT Module
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

// Mock Passport Module and Strategy
jest.mock('@nestjs/passport', () => {
  // Mock class for AuthGuard
  class MockAuthGuard {
    constructor(strategy) {
      this.strategy = strategy;
    }
    
    canActivate() {
      return true;
    }
  }
  
  // Mock function for AuthGuard that returns the class
  const mockAuthGuard = jest.fn().mockImplementation((strategy) => {
    return MockAuthGuard;
  });
  
  // Mock function for PassportStrategy
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

// Mock passport-jwt
jest.mock('passport-jwt', () => {
  return {
    Strategy: jest.fn()
  };
});

// Mock sharp
jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('test'))
  }));
});

// Mock ical-generator
jest.mock('ical-generator', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      createEvent: jest.fn().mockReturnThis(),
      setOrganizer: jest.fn().mockReturnThis(),
      setStart: jest.fn().mockReturnThis(),
      setEnd: jest.fn().mockReturnThis(),
      setSummary: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      setLocation: jest.fn().mockReturnThis(),
      toString: jest.fn().mockReturnValue('mock-ical-content')
    }))
  };
});

// Mock @nestjs/swagger
jest.mock('@nestjs/swagger', () => {
  return {
    ApiProperty: jest.fn(),
    ApiTags: jest.fn(),
    ApiOperation: jest.fn(),
    ApiResponse: jest.fn(),
    ApiConsumes: jest.fn(),
    ApiBody: jest.fn(),
    ApiBearerAuth: jest.fn(),
    DocumentBuilder: jest.fn().mockImplementation(() => ({
      setTitle: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      setVersion: jest.fn().mockReturnThis(),
      addBearerAuth: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({})
    })),
    SwaggerModule: {
      createDocument: jest.fn(),
      setup: jest.fn()
    }
  };
});