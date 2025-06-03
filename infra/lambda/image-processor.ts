import { S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import * as sharp from 'sharp';

const s3Client = new S3Client({});

export const handler = async (event: S3Event): Promise<void> => {
  try {
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      
      if (!key.startsWith('profiles/')) {
        console.log(`Skipping non-profile file: ${key}`);
        continue;
      }

      const getObjectParams = {
        Bucket: bucket,
        Key: key
      };
      
      const { Body } = await s3Client.send(new GetObjectCommand(getObjectParams));
      const imageBuffer = await streamToBuffer(Body);
      
      const processedImageBuffer = await sharp(imageBuffer)
        .resize(300, 300, {
          fit: 'cover',
          position: 'center',
        })
        .toBuffer();
      
      const putObjectParams = {
        Bucket: bucket,
        Key: key,
        Body: processedImageBuffer,
        ContentType: 'image/jpeg'
      };
      
      await s3Client.send(new PutObjectCommand(putObjectParams));
      console.log(`Image processed successfully: ${key}`);
    }
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

async function streamToBuffer(stream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}