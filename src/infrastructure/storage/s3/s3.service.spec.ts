import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as sharp from 'sharp';
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

jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image'))
  }));
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
    mockS3Send = (S3Client as jest.Mock).mock.results[0]?.value.send;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should process non-profile images locally', async () => {
      const key = 'events/test-image.jpg';
      
      await service.uploadFile(mockFile, key);
      
      expect(sharp).toHaveBeenCalledWith(mockFile.buffer);
      expect(PutObjectCommand).toHaveBeenCalledWith(expect.objectContaining({
        Bucket: 'test-bucket',
        Key: key
      }));
    });

    it('should not process profile images locally', async () => {
      const key = 'profiles/user-123.jpg';
      
      await service.uploadFile(mockFile, key);
      
      expect(sharp).not.toHaveBeenCalled();
      expect(PutObjectCommand).toHaveBeenCalledWith(expect.objectContaining({
        Bucket: 'test-bucket',
        Key: key,
        Body: mockFile.buffer // Should use original buffer
      }));
    });

    it('should throw error for invalid file', async () => {
      const emptyFile = { buffer: null } as any;
      await expect(service.uploadFile(emptyFile, 'test.jpg')).rejects.toThrow(ValidationException);
    });

    it('should handle S3 upload errors', async () => {
      mockS3Send.mockRejectedValueOnce(new Error('S3 error'));
      
      await expect(service.uploadFile(mockFile, 'test.jpg')).rejects.toThrow('Failed to process or upload image');
    });

    it('should return mock URL in development mode', async () => {
      // Set service to development mode
      Object.defineProperty(service, 'isDevelopment', { value: true });
      
      const result = await service.uploadFile(mockFile, 'test.jpg');
      
      expect(result).toBe('https://mock-s3-url.com/test.jpg');
      expect(mockS3Send).not.toHaveBeenCalled();
    });
  });
});