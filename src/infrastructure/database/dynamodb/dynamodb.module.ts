import { Module, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBService } from './dynamodb.service';
import { createEventTable, createUserTable, createRegistrationTable } from './dynamodb.utils';
import { ConfigModule } from '../../../config/config.module';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'DYNAMODB_CLIENT',
      useFactory: (configService: ConfigService) => {
       
        if (process.env.NODE_ENV === 'test') {
          return {
            send: jest.fn().mockResolvedValue({}),
            config: {},
            middlewareStack: {
              add: jest.fn(),
              addRelativeTo: jest.fn(),
              clone: jest.fn(),
              remove: jest.fn(),
              resolve: jest.fn(),
              use: jest.fn(),
            }
          };
        }
        
        return new DynamoDBClient({
          region: configService.get('AWS_REGION', 'us-east-1'),
          credentials: {
            accessKeyId: configService.get('AWS_ACCESS_KEY_ID', ''),
            secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY', ''),
            sessionToken: configService.get('AWS_SESSION_TOKEN'),
          },
        });
      },
      inject: [ConfigService],
    },
    DynamoDBService,
  ],
  exports: [DynamoDBService, 'DYNAMODB_CLIENT'],
})
export class DynamoDBModule implements OnModuleInit {
  private readonly logger = new Logger(DynamoDBModule.name);
  
  constructor(
    @Inject('DYNAMODB_CLIENT') private readonly dynamoDBClient: DynamoDBClient,
  ) {}

  async onModuleInit() {
   
    if (process.env.NODE_ENV === 'test') {
      this.logger.log('Test environment detected, skipping DynamoDB table creation');
      return;
    }
    
    try {
      await createEventTable(this.dynamoDBClient);
      await createUserTable(this.dynamoDBClient);
      await createRegistrationTable(this.dynamoDBClient);
    } catch (error) {
      
      if (process.env.NODE_ENV === 'development') {
        this.logger.error(`Failed to initialize DynamoDB tables: ${error.message}`);
      } else {
        throw error;
      }
    }
  }
}