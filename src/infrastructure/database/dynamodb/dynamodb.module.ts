import { Module, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBService } from './dynamodb.service';
import { createEventTable, createUserTable } from './dynamodb.utils';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'DYNAMODB_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new DynamoDBClient({
          region: configService.get('AWS_REGION') || 'us-east-1',
          credentials: {
            accessKeyId: configService.get('AWS_ACCESS_KEY_ID') || 'dummy',
            secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY') || 'dummy',
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
  ) {}

  async onModuleInit() {
    await createEventTable(this.dynamoDBClient);
    await createUserTable(this.dynamoDBClient);
  }
}