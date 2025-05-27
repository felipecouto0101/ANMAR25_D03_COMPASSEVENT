import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as sharp from 'sharp';
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
  private readonly isEnabled: boolean = false;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get('AWS_REGION');
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');
    const sessionToken = this.configService.get('AWS_SESSION_TOKEN');
    const bucketName = this.configService.get('AWS_S3_BUCKET_NAME');

    if (region && accessKeyId && secretAccessKey && bucketName) {
      this.isEnabled = true;
      this.s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
          sessionToken,
        },
      });
      this.bucketName = bucketName;
      this.logger.log('S3 service is enabled');
    } else {
      this.logger.warn('S3 service is disabled due to missing credentials or configuration');
      this.bucketName = 'development-bucket';
    }
  }

  async uploadFile(file: MulterFile, key: string): Promise<string> {
    if (!file || !file.buffer) {
      throw new ValidationException('Invalid file provided', {
        image: 'A valid image file is required'
      });
    }

    try {
      if (!this.isEnabled) {
        this.logger.warn('S3 upload skipped (service disabled), returning mock URL');
        return `https://mock-s3-url.com/${key}`;
      }
      
      const processedImageBuffer = await sharp(file.buffer)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center',
        })
        .toBuffer();

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: processedImageBuffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);
      this.logger.log(`File uploaded successfully to S3: ${key}`);
      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    } catch (error) {
      this.logger.error(`Failed to upload file to S3: ${error.message}`);
      throw new ValidationException('Failed to process or upload image', {
        image: 'Please try with a different image file'
      });
    }
  }
}