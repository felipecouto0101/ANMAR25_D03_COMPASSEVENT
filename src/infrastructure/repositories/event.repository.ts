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
      IndexName: 'DateIndex',
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

  async findByName(name: string): Promise<Event | null> {
    const result = await this.dynamoDBService.scan({
      TableName: this.tableName,
      FilterExpression: '#name = :name',
      ExpressionAttributeNames: {
        '#name': 'name',
      },
      ExpressionAttributeValues: {
        ':name': name,
      },
    });

    const items = result.Items as Event[];
    return items && items.length > 0 ? items[0] : null;
  }

  async findWithFilters(filters: {
    name?: string;
    startDate?: string;
    endDate?: string;
    active?: boolean;
    page: number;
    limit: number;
  }): Promise<{ items: Event[]; total: number }> {
    let filterExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (filters.name) {
      filterExpressions.push('contains(#name, :name)');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = filters.name;
    }

    if (filters.startDate) {
      filterExpressions.push('#date >= :startDate');
      expressionAttributeNames['#date'] = 'date';
      expressionAttributeValues[':startDate'] = filters.startDate;
    }

    if (filters.endDate) {
      filterExpressions.push('#date <= :endDate');
      expressionAttributeNames['#date'] = 'date';
      expressionAttributeValues[':endDate'] = filters.endDate;
    }

    if (filters.active !== undefined) {
      filterExpressions.push('#active = :active');
      expressionAttributeNames['#active'] = 'active';
      expressionAttributeValues[':active'] = filters.active;
    }

    const scanParams: any = {
      TableName: this.tableName,
    };

    if (filterExpressions.length > 0) {
      scanParams.FilterExpression = filterExpressions.join(' AND ');
      scanParams.ExpressionAttributeNames = expressionAttributeNames;
      scanParams.ExpressionAttributeValues = expressionAttributeValues;
    }

    const result = await this.dynamoDBService.scan(scanParams);
    const items = result.Items as Event[];
    const total = items.length;

    const startIndex = (filters.page - 1) * filters.limit;
    const paginatedItems = items.slice(startIndex, startIndex + filters.limit);

    return {
      items: paginatedItems,
      total,
    };
  }
}