import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import { S3Client } from '@aws-sdk/client-s3';
import { ValidationException } from '../../../domain/exceptions/domain.exceptions';

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockImplementation((command) => {
        if (command.constructor.name === 'CreateBucketCommand') {
          return Promise.resolve({});
        }
        return Promise.resolve({});
      }),
    })),
    CreateBucketCommand: jest.fn(),
    PutObjectCommand: jest.fn(),
  };
});

jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('test')),
  }));
});

describe('S3Service', () => {
  let service: S3Service;
  let configService: ConfigService;
  let s3ClientMock: any;

  beforeEach(async () => {
    s3ClientMock = {
      send: jest.fn().mockResolvedValue({}),
    };
    
    (S3Client as jest.Mock).mockImplementation(() => s3ClientMock);
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              const config = {
                AWS_REGION: 'us-east-1',
                AWS_ACCESS_KEY_ID: 'test-key',
                AWS_SECRET_ACCESS_KEY: 'test-secret',
                AWS_S3_BUCKET_NAME: 'test-bucket',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upload a file successfully', async () => {
    const result = await service.uploadFile({
      buffer: Buffer.from('test'),
      mimetype: 'image/jpeg',
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      size: 100,
    }, 'test.jpg');

    expect(result).toBe('https://test-bucket.s3.amazonaws.com/test.jpg');
  });

  it('should initialize in development mode when credentials are missing', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    const devService = moduleRef.get<S3Service>(S3Service);
    expect(devService).toBeDefined();
    
    const result = await devService.uploadFile({
      buffer: Buffer.from('test'),
      mimetype: 'image/jpeg',
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      size: 100,
    }, 'test.jpg');
    
    expect(result).toBe('https://mock-s3-url.com/test.jpg');
  });

  it('should throw ValidationException when file is invalid', async () => {
    await expect(service.uploadFile(null as any, 'test.jpg')).rejects.toThrow(ValidationException);
    await expect(service.uploadFile({} as any, 'test.jpg')).rejects.toThrow(ValidationException);
  });

  it('should handle upload errors', async () => {
    s3ClientMock.send.mockRejectedValueOnce(new Error('Upload failed'));
    
    await expect(service.uploadFile({
      buffer: Buffer.from('test'),
      mimetype: 'image/jpeg',
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      size: 100,
    }, 'test.jpg')).rejects.toThrow(ValidationException);
  });

  it('should handle bucket creation errors', async () => {
    const errorMockS3Client = {
      send: jest.fn().mockRejectedValueOnce(new Error('Bucket creation failed')).mockResolvedValue({}),
    };
    
    (S3Client as jest.Mock).mockImplementationOnce(() => errorMockS3Client);
    
    const moduleRef = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              const config = {
                AWS_REGION: 'us-east-1',
                AWS_ACCESS_KEY_ID: 'test-key',
                AWS_SECRET_ACCESS_KEY: 'test-secret',
                AWS_S3_BUCKET_NAME: 'test-bucket',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    const errorService = moduleRef.get<S3Service>(S3Service);
    expect(errorService).toBeDefined();
  });

  it('should handle bucket already exists case', async () => {
    const bucketExistsError = { name: 'BucketAlreadyExists', message: 'Bucket already exists' };
    const bucketMockS3Client = {
      send: jest.fn().mockRejectedValueOnce(bucketExistsError).mockResolvedValue({}),
    };
    
    (S3Client as jest.Mock).mockImplementationOnce(() => bucketMockS3Client);
    
    const moduleRef = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              const config = {
                AWS_REGION: 'us-east-1',
                AWS_ACCESS_KEY_ID: 'test-key',
                AWS_SECRET_ACCESS_KEY: 'test-secret',
                AWS_S3_BUCKET_NAME: 'test-bucket',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    const bucketService = moduleRef.get<S3Service>(S3Service);
    expect(bucketService).toBeDefined();
  });

  it('should not throw error on upload failure in development mode', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(undefined),
          },
        },
      ],
    }).compile();

    const devService = moduleRef.get<S3Service>(S3Service);
    const devMockS3Client = {
      send: jest.fn().mockRejectedValueOnce(new Error('Upload failed')),
    };
    
    (S3Client as jest.Mock).mockImplementationOnce(() => devMockS3Client);
    
    const result = await devService.uploadFile({
      buffer: Buffer.from('test'),
      mimetype: 'image/jpeg',
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      size: 100,
    }, 'test.jpg');
    
    expect(result).toBe('https://mock-s3-url.com/test.jpg');
  });
});