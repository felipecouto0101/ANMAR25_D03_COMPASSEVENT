import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ValidationException } from '../../../domain/exceptions/domain.exceptions';


jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn().mockResolvedValue({});
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockSend
    })),
    PutObjectCommand: jest.fn()
  };
});

describe('S3Service', () => {
  let service: S3Service;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockS3Send;

  const mockFile = {
    fieldname: 'image',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test-image'),
    size: 1024
  };

  describe('with AWS credentials', () => {
    beforeEach(async () => {
      mockConfigService = {
        get: jest.fn((key: string) => {
          switch (key) {
            case 'AWS_REGION': return 'us-east-1';
            case 'AWS_ACCESS_KEY_ID': return 'test-key';
            case 'AWS_SECRET_ACCESS_KEY': return 'test-secret';
            case 'AWS_S3_BUCKET_NAME': return 'test-bucket';
            case 'AWS_SESSION_TOKEN': return 'test-token';
            default: return undefined;
          }
        })
      } as any;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          S3Service,
          { provide: ConfigService, useValue: mockConfigService }
        ],
      }).compile();

      service = module.get<S3Service>(S3Service);
      mockS3Send = (S3Client as jest.Mock).mock.results[0]?.value.send;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize S3Client with proper credentials', () => {
      expect(S3Client).toHaveBeenCalledWith({
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret',
          sessionToken: 'test-token'
        }
      });
    });

    describe('uploadFile', () => {
      it('should upload files without processing', async () => {
        const key = 'test-image.jpg';
        
        const result = await service.uploadFile(mockFile, key);
        
        expect(PutObjectCommand).toHaveBeenCalledWith(expect.objectContaining({
          Bucket: 'test-bucket',
          Key: key,
          Body: mockFile.buffer,
          ContentType: 'image/jpeg'
        }));
        expect(result).toBe('https://test-bucket.s3.amazonaws.com/test-image.jpg');
      });

      it('should upload profile images without processing', async () => {
        const key = 'profiles/user-123.jpg';
        
        await service.uploadFile(mockFile, key);
        
        expect(PutObjectCommand).toHaveBeenCalledWith(expect.objectContaining({
          Bucket: 'test-bucket',
          Key: key,
          Body: mockFile.buffer
        }));
      });

      it('should upload event images without processing', async () => {
        const key = 'events/event-123.jpg';
        
        await service.uploadFile(mockFile, key);
        
        expect(PutObjectCommand).toHaveBeenCalledWith(expect.objectContaining({
          Bucket: 'test-bucket',
          Key: key,
          Body: mockFile.buffer
        }));
      });

      it('should throw error for invalid file', async () => {
        const emptyFile = { buffer: null } as any;
        await expect(service.uploadFile(emptyFile, 'test.jpg')).rejects.toThrow(ValidationException);
      });

      it('should throw error for file without buffer', async () => {
        const fileWithoutBuffer = { fieldname: 'image' } as any;
        await expect(service.uploadFile(fileWithoutBuffer, 'test.jpg')).rejects.toThrow(ValidationException);
      });

      it('should handle S3 upload errors', async () => {
        mockS3Send.mockRejectedValueOnce(new Error('S3 error'));
        
        await expect(service.uploadFile(mockFile, 'test.jpg')).rejects.toThrow('Failed to upload image');
      });
    });
  });

  describe('without AWS credentials', () => {
    beforeEach(async () => {
      mockConfigService = {
        get: jest.fn((key: string) => {
         
          return undefined;
        })
      } as any;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          S3Service,
          { provide: ConfigService, useValue: mockConfigService }
        ],
      }).compile();

      service = module.get<S3Service>(S3Service);
      mockS3Send = (S3Client as jest.Mock).mock.results[0]?.value.send;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should initialize in development mode when credentials are missing', () => {
      
      expect((service as any).isDevelopment).toBe(true);
      expect((service as any).bucketName).toBe('development-bucket');
      expect(S3Client).toHaveBeenCalledWith({});
    });

    it('should return mock URL in development mode', async () => {
      const result = await service.uploadFile(mockFile, 'test.jpg');
      
      expect(result).toBe('https://mock-s3-url.com/test.jpg');
      expect(mockS3Send).not.toHaveBeenCalled();
    });

    it('should return mock URL in development mode even when S3 would fail', async () => {
   
      mockS3Send.mockRejectedValueOnce(new Error('S3 error'));
      
     
      Object.defineProperty(service, 'isDevelopment', { value: true });
      
      const result = await service.uploadFile(mockFile, 'test.jpg');
      
      expect(result).toBe('https://mock-s3-url.com/test.jpg');
    });
  });

  describe('with partial AWS credentials', () => {
    beforeEach(async () => {
      mockConfigService = {
        get: jest.fn((key: string) => {
          switch (key) {
            case 'AWS_REGION': return 'us-east-1';
            case 'AWS_ACCESS_KEY_ID': return 'test-key';
            
            case 'AWS_S3_BUCKET_NAME': return undefined;
            default: return undefined;
          }
        })
      } as any;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          S3Service,
          { provide: ConfigService, useValue: mockConfigService }
        ],
      }).compile();

      service = module.get<S3Service>(S3Service);
      mockS3Send = (S3Client as jest.Mock).mock.results[0]?.value.send;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should initialize in development mode when some credentials are missing', () => {
      expect((service as any).isDevelopment).toBe(true);
      expect((service as any).bucketName).toBe('development-bucket');
    });
  });

  describe('with AWS credentials but without session token', () => {
    beforeEach(async () => {
      mockConfigService = {
        get: jest.fn((key: string) => {
          switch (key) {
            case 'AWS_REGION': return 'us-east-1';
            case 'AWS_ACCESS_KEY_ID': return 'test-key';
            case 'AWS_SECRET_ACCESS_KEY': return 'test-secret';
            case 'AWS_S3_BUCKET_NAME': return 'test-bucket';
           
            default: return undefined;
          }
        })
      } as any;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          S3Service,
          { provide: ConfigService, useValue: mockConfigService }
        ],
      }).compile();

      service = module.get<S3Service>(S3Service);
    });

    it('should initialize S3Client without session token', () => {
      expect(S3Client).toHaveBeenCalledWith({
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret'
         
        }
      });
    });
  });
});