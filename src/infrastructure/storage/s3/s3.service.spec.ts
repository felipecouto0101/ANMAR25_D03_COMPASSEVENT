import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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
  let configService: ConfigService;
  
 
  const mockFile = {
    buffer: Buffer.from('test-image'),
    originalname: 'test.jpg',
    mimetype: 'image/jpeg'
  } as Express.Multer.File;

  describe('with AWS credentials', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          S3Service,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key) => {
                switch (key) {
                  case 'AWS_S3_BUCKET_NAME':
                    return 'test-bucket';
                  case 'AWS_REGION':
                    return 'us-east-1';
                  case 'AWS_ACCESS_KEY_ID':
                    return 'test-key';
                  case 'AWS_SECRET_ACCESS_KEY':
                    return 'test-secret';
                  case 'AWS_SESSION_TOKEN':
                    return 'test-token';
                  default:
                    return undefined;
                }
              })
            }
          }
        ],
      }).compile();

      service = module.get<S3Service>(S3Service);
      configService = module.get<ConfigService>(ConfigService);
      
    
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    
    it.skip('should initialize S3Client with proper credentials', () => {
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
      it.skip('should upload files without processing', async () => {
        const key = 'test-image.jpg';
        const result = await service.uploadFile(mockFile, key);
        
        expect(PutObjectCommand).toHaveBeenCalledWith(expect.objectContaining({
          Bucket: 'test-bucket',
          Key: key,
          Body: mockFile.buffer,
          ContentType: mockFile.mimetype
        }));
        
        expect(result).toMatch(/^https:\/\//);
      });

      it.skip('should upload profile images without processing', async () => {
        const key = 'profiles/user-123.jpg';
        await service.uploadFile(mockFile, key);
        
        expect(PutObjectCommand).toHaveBeenCalledWith(expect.objectContaining({
          Bucket: 'test-bucket',
          Key: key,
          Body: mockFile.buffer
        }));
      });

      it.skip('should upload event images without processing', async () => {
        const key = 'events/event-123.jpg';
        await service.uploadFile(mockFile, key);
        
        expect(PutObjectCommand).toHaveBeenCalledWith(expect.objectContaining({
          Bucket: 'test-bucket',
          Key: key,
          Body: mockFile.buffer
        }));
      });

      it.skip('should handle S3 upload errors', async () => {
      
        await expect(service.uploadFile(mockFile, 'test.jpg')).rejects.toThrow('Failed to upload image');
      });
    });
  });

  describe('without AWS credentials', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          S3Service,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key) => {
                if (key === 'AWS_S3_BUCKET_NAME') return 'test-bucket';
                return undefined;
              })
            }
          }
        ],
      }).compile();

      service = module.get<S3Service>(S3Service);
      

      jest.clearAllMocks();
    });

    it.skip('should initialize in development mode when credentials are missing', () => {
      expect((service as any).isDevelopment).toBe(true);
      expect((service as any).bucketName).toBe('development-bucket');
      expect(S3Client).toHaveBeenCalledWith({});
    });

    it.skip('should return mock URL in development mode', async () => {
      const result = await service.uploadFile(mockFile, 'test.jpg');
      
      expect(result).toBe('https://mock-s3-url.com/test.jpg');
    
    });

    it.skip('should return mock URL in development mode even when S3 would fail', async () => {
    
      
      Object.defineProperty(service, 'isDevelopment', { value: true });
      
      const result = await service.uploadFile(mockFile, 'test.jpg');
      expect(result).toBe('https://mock-s3-url.com/test.jpg');
    });
  });

  describe('with partial AWS credentials', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          S3Service,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key) => {
                switch (key) {
                  case 'AWS_S3_BUCKET_NAME':
                    return 'test-bucket';
                  case 'AWS_REGION':
                    return 'us-east-1';
                  
                  default:
                    return undefined;
                }
              })
            }
          }
        ],
      }).compile();

      service = module.get<S3Service>(S3Service);
    });

    it.skip('should initialize in development mode when some credentials are missing', () => {
      expect((service as any).isDevelopment).toBe(true);
      expect((service as any).bucketName).toBe('development-bucket');
    });
  });

  describe('with AWS credentials but without session token', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          S3Service,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key) => {
                switch (key) {
                  case 'AWS_S3_BUCKET_NAME':
                    return 'test-bucket';
                  case 'AWS_REGION':
                    return 'us-east-1';
                  case 'AWS_ACCESS_KEY_ID':
                    return 'test-key';
                  case 'AWS_SECRET_ACCESS_KEY':
                    return 'test-secret';
             
                  default:
                    return undefined;
                }
              })
            }
          }
        ],
      }).compile();

      service = module.get<S3Service>(S3Service);
      

      jest.clearAllMocks();
    });

    it.skip('should initialize S3Client without session token', () => {
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