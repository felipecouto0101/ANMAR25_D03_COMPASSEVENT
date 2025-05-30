import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ValidationException } from '../../../domain/exceptions/domain.exceptions';


const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  PutObjectCommand: jest.fn(),
}));

jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image')),
  }));
});

describe('S3Service', () => {
  let service: S3Service;
  let mockConfigService: jest.Mocked<ConfigService>;

  const mockConfig = {
    'AWS_REGION': 'us-east-1',
    'AWS_ACCESS_KEY_ID': 'test-key',
    'AWS_SECRET_ACCESS_KEY': 'test-secret',
    'AWS_SESSION_TOKEN': 'test-token',
    'AWS_S3_BUCKET_NAME': 'test-bucket',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    mockConfigService = {
      get: jest.fn((key: string) => mockConfig[key]),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize with all credentials', async () => {
      expect(S3Client).toHaveBeenCalledWith({
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
          sessionToken: 'test-token',
        },
      });
    });

    it('should initialize in development mode when credentials are missing', async () => {
      jest.clearAllMocks();
      
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'AWS_REGION') return undefined;
        return mockConfig[key];
      });
      
      const module = await Test.createTestingModule({
        providers: [
          S3Service,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const devService = module.get<S3Service>(S3Service);
      expect(devService).toBeDefined();
      
      const isDevelopment = (devService as any).isDevelopment;
      expect(isDevelopment).toBe(true);
    });
  });

  describe('uploadFile', () => {
    const mockFile = {
      fieldname: 'image',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 12345,
      buffer: Buffer.from('test-image'),
    };

    it('should throw error when file is invalid', async () => {
      await expect(service.uploadFile(null as any, 'test-key')).rejects.toThrow(ValidationException);
      await expect(service.uploadFile({} as any, 'test-key')).rejects.toThrow(ValidationException);
    });

    it('should upload file successfully', async () => {
      mockSend.mockResolvedValueOnce({} as any);
      
      const result = await service.uploadFile(mockFile, 'test-key');
      
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'test-key',
        Body: expect.any(Buffer),
        ContentType: 'image/jpeg',
      });
      
      expect(mockSend).toHaveBeenCalled();
      expect(result).toBe('https://test-bucket.s3.amazonaws.com/test-key');
    });

    it('should handle upload errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('Upload failed') as never);
      
      await expect(service.uploadFile(mockFile, 'test-key')).rejects.toThrow(ValidationException);
    });

    it('should return mock URL in development mode', async () => {
      jest.clearAllMocks();
      
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'AWS_REGION') return undefined;
        return mockConfig[key];
      });
      
      const module = await Test.createTestingModule({
        providers: [
          S3Service,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const devService = module.get<S3Service>(S3Service);
      const result = await devService.uploadFile(mockFile, 'test-key');
      
      expect(result).toBe('https://mock-s3-url.com/test-key');
    });
  });
});