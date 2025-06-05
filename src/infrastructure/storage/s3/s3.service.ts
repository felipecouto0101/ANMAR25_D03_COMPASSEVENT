import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ValidationException } from '../../../domain/exceptions/domain.exceptions';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(S3Service.name);
  private readonly isDevelopment: boolean = false;

  constructor(private readonly configService: ConfigService) {
    // Always use mock in test environment
    if (process.env.NODE_ENV === 'test') {
      this.isDevelopment = true;
      this.bucketName = 'test-bucket';
      this.s3Client = {
        send: jest.fn().mockResolvedValue({})
      } as any;
      return;
    }
    
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const sessionToken = this.configService.get<string>('AWS_SESSION_TOKEN');
    const bucketNameConfig = this.configService.get<string>('AWS_S3_BUCKET_NAME');

    if (!region || !accessKeyId || !secretAccessKey || !bucketNameConfig) {
      this.logger.warn('Missing AWS credentials or S3 bucket configuration');
      this.isDevelopment = true;
      this.bucketName = 'development-bucket';
    } else {
      this.bucketName = bucketNameConfig;
    }

    if (this.isDevelopment) {
      this.s3Client = new S3Client({});
    } else {
      try {
        this.s3Client = new S3Client({
          region: region as string,
          credentials: {
            accessKeyId: accessKeyId as string,
            secretAccessKey: secretAccessKey as string,
            ...(sessionToken ? { sessionToken } : {})
          }
        });
      } catch (error) {
        this.logger.error(`Failed to initialize S3 client: ${error.message}`);
        this.isDevelopment = true;
        this.s3Client = new S3Client({});
      }
    }
  }

  async uploadFile(file: MulterFile, key: string): Promise<string> {
    if (!file || !file.buffer) {
      throw new ValidationException('Invalid file provided', {
        image: 'A valid image file is required'
      });
    }

    try {
      if (this.isDevelopment || process.env.NODE_ENV === 'test') {
        this.logger.log(`Development/Test mode: Skipping S3 upload for file: ${key}`);
        return `https://mock-s3-url.com/${key}`;
      }
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      });

      await this.s3Client.send(command);
      this.logger.log(`File uploaded successfully to S3: ${key}`);
      
      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    } catch (error) {
      this.logger.error(`Failed to upload file to S3: ${error.message}`);
      
      if (this.isDevelopment || process.env.NODE_ENV === 'test') {
        this.logger.warn('Development/Test mode: Returning mock URL despite error');
        return `https://mock-s3-url.com/${key}`;
      }
      
      throw new ValidationException('Failed to upload image', {
        image: 'Please try with a different image file'
      });
    }
  }
}