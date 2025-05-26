import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as sharp from 'sharp';

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

  constructor(private readonly configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || 'dummy',
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || 'dummy',
        sessionToken: this.configService.get('AWS_SESSION_TOKEN'),
      },
    });
    
    const bucketName = this.configService.get('AWS_S3_BUCKET_NAME');
    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET_NAME environment variable is not defined');
    }
    this.bucketName = bucketName;
  }

  async uploadFile(file: MulterFile, key: string): Promise<string> {
    try {
      
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
      return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
    } catch (error) {
      throw new BadRequestException('Failed to process or upload image');
    }
  }
}