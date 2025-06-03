import { handler } from './image-processor';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import * as sharp from 'sharp';


jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn();
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: mockSend
    })),
    GetObjectCommand: jest.fn(),
    PutObjectCommand: jest.fn()
  };
});


jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('processed-image'))
  }));
});

describe('Image Processor Lambda', () => {
  let mockS3Send;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockS3Send = (S3Client as jest.Mock).mock.results[0]?.value.send || jest.fn();
    
    
    mockS3Send.mockImplementation((command) => {
      if (command instanceof GetObjectCommand) {
        return Promise.resolve({
          Body: {
            on: (event, callback) => {
              if (event === 'data') callback(Buffer.from('test-image'));
              if (event === 'end') setTimeout(() => callback(), 10);
              return { on: jest.fn() };
            }
          }
        });
      }
      return Promise.resolve({});
    });
  });

  it('should process profile images', async () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'profiles/user-123.jpg' }
          }
        }
      ]
    };

    await handler(event as any);

    expect(GetObjectCommand).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      Key: 'profiles/user-123.jpg'
    });

    expect(sharp).toHaveBeenCalled();

    expect(PutObjectCommand).toHaveBeenCalledWith(expect.objectContaining({
      Bucket: 'test-bucket',
      Key: 'profiles/user-123.jpg',
      ContentType: 'image/jpeg'
    }));
  });

  it('should process event images', async () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'events/event-123.jpg' }
          }
        }
      ]
    };

    await handler(event as any);

    expect(GetObjectCommand).toHaveBeenCalledWith({
      Bucket: 'test-bucket',
      Key: 'events/event-123.jpg'
    });

    expect(sharp).toHaveBeenCalled();

    expect(PutObjectCommand).toHaveBeenCalledWith(expect.objectContaining({
      Bucket: 'test-bucket',
      Key: 'events/event-123.jpg',
      ContentType: 'image/jpeg'
    }));
  });

  it('should skip non-processable images', async () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'other/image-123.jpg' }
          }
        }
      ]
    };

    await handler(event as any);

    expect(GetObjectCommand).not.toHaveBeenCalled();
    expect(sharp).not.toHaveBeenCalled();
    expect(PutObjectCommand).not.toHaveBeenCalled();
  });

  it('should handle multiple records', async () => {
    const event = {
      Records: [
        {
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'profiles/user-123.jpg' }
          }
        },
        {
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'other/image-123.jpg' }
          }
        },
        {
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'events/event-456.jpg' }
          }
        }
      ]
    };

    await handler(event as any);

    expect(GetObjectCommand).toHaveBeenCalledTimes(2);
    expect(PutObjectCommand).toHaveBeenCalledTimes(2);
  });

  it('should handle errors gracefully', async () => {
    
    mockS3Send.mockRejectedValueOnce(new Error('S3 error'));

    const event = {
      Records: [
        {
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'profiles/user-123.jpg' }
          }
        }
      ]
    };

    await expect(handler(event as any)).rejects.toThrow('S3 error');
  });
});