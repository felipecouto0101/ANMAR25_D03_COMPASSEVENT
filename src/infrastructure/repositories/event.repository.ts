import { Injectable } from '@nestjs/common';
import { BaseDynamoDBRepository } from './base.dynamodb.repository';
import { Event } from '../../domain/entities/event.entity';
import { EventRepository } from '../../domain/repositories/event.repository.interface';
import { DynamoDBService } from '../database/dynamodb/dynamodb.service';

@Injectable()
export class EventDynamoDBRepository extends BaseDynamoDBRepository<Event> implements EventRepository {
  protected tableName = 'Events';
  protected primaryKey = 'id';

  constructor(dynamoDBService: DynamoDBService) {
    super(dynamoDBService);
  }

  async findByDate(date: string): Promise<Event[]> {
    const result = await this.dynamoDBService.query({
      TableName: this.tableName,
      KeyConditionExpression: '#date = :date',
      ExpressionAttributeNames: {
        '#date': 'date',
      },
      ExpressionAttributeValues: {
        ':date': date,
      },
    });

    return (result.Items || []) as Event[];
  }
}