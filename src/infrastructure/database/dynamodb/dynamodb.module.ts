import { Module, OnModuleInit, Inject } from '@nestjs/common';
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
  constructor(
    @Inject('DYNAMODB_CLIENT') private readonly dynamoDBClient: DynamoDBClient,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    
    const isTestEnvironment = this.configService.get('NODE_ENV') === 'test';
    
    if (!isTestEnvironment) {
      try {
        await createEventTable(this.dynamoDBClient);
        await createUserTable(this.dynamoDBClient);
        await createRegistrationTable(this.dynamoDBClient);
      } catch (error) {
        console.error('Error initializing DynamoDB tables:', error);
        
        if (this.configService.get('NODE_ENV') !== 'development') {
          throw error;
        }
      }
    }
  }
}