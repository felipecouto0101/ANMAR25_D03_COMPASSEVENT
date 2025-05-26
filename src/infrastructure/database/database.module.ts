import { Module } from '@nestjs/common';
import { DynamoDBModule } from './dynamodb/dynamodb.module';

@Module({
  imports: [DynamoDBModule],
  exports: [DynamoDBModule],
})
export class DatabaseModule {}