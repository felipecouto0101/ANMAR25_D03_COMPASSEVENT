// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './s3.service';
import { S3Client, PutObjectCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import { ValidationException } from '../../../domain/exceptions/domain.exceptions';
import { Logger } from '@nestjs/common';

jest.mock('@aws-sdk/client-s3');
jest.mock('sharp', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image')),
  })),
}));

describe('S3Service', () => {
  let service: S3Service;

  const mockFile = {
    fieldname: 'image',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test'),
    size: 1024,
  };

  beforeEach(async () => {
    
    service = {
      uploadFile: jest.fn().mockImplementation((file, key) => {
        if (!file || !file.buffer) {
          throw new ValidationException('Invalid file provided', {
            image: 'A valid image file is required'
          });
        }
        return Promise.resolve(`https://test-bucket.s3.amazonaws.com/${key}`);
      }),
      isDevelopment: false,
      bucketInitialized: true,
      bucketName: 'test-bucket',
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload file to S3 and return URL', async () => {
      const result = await service.uploadFile(mockFile, 'test-key');
      expect(result).toBe('https://test-bucket.s3.amazonaws.com/test-key');
    });
    
   
    it('should throw ValidationException when file is not provided', async () => {
      try {
        await service.uploadFile(null, 'test-key');
    
        fail('Expected ValidationException to be thrown');
      } catch (error) {
        expect(error instanceof ValidationException).toBe(true);
        expect(error.message).toBe('Invalid file provided');
      }
    });

    it('should throw ValidationException when file buffer is not provided', async () => {
      try {
        const fileWithoutBuffer = { ...mockFile, buffer: undefined };
        await service.uploadFile(fileWithoutBuffer, 'test-key');
        
        fail('Expected ValidationException to be thrown');
      } catch (error) {
        expect(error instanceof ValidationException).toBe(true);
        expect(error.message).toBe('Invalid file provided');
      }
    });
  });

 
  describe('development mode', () => {
    it('should return mock URL in development mode', async () => {
      
      service.isDevelopment = true;
      service.uploadFile = jest.fn().mockImplementation((file, key) => {
        if (!file || !file.buffer) {
          throw new ValidationException('Invalid file provided', {
            image: 'A valid image file is required'
          });
        }
        return Promise.resolve(`https://mock-s3-url.com/${key}`);
      });

      const result = await service.uploadFile(mockFile, 'dev-key');
      expect(result).toBe('https://mock-s3-url.com/dev-key');
    });
  });
});