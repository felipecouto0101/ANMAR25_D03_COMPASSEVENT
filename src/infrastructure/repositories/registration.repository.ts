import { Injectable } from '@nestjs/common';
import { BaseDynamoDBRepository } from './base.dynamodb.repository';
import { Registration } from '../../domain/entities/registration.entity';
import { RegistrationRepository } from '../../domain/repositories/registration.repository.interface';
import { DynamoDBService } from '../database/dynamodb/dynamodb.service';

@Injectable()
export class RegistrationDynamoDBRepository extends BaseDynamoDBRepository<Registration> implements RegistrationRepository {
  protected tableName = 'Registrations';
  protected primaryKey = 'id';

  constructor(dynamoDBService: DynamoDBService) {
    super(dynamoDBService);
  }

  async findByUserAndEvent(userId: string, eventId: string): Promise<Registration | null> {
    const result = await this.dynamoDBService.scan({
      TableName: this.tableName,
      FilterExpression: '#userId = :userId AND #eventId = :eventId',
      ExpressionAttributeNames: {
        '#userId': 'userId',
        '#eventId': 'eventId',
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':eventId': eventId,
      },
    });

    const items = result.Items as Registration[];
    return items && items.length > 0 ? items[0] : null;
  }

  async findByUser(userId: string, page: number, limit: number): Promise<{ items: Registration[]; total: number }> {
    const result = await this.dynamoDBService.scan({
      TableName: this.tableName,
      FilterExpression: '#userId = :userId AND #active = :active',
      ExpressionAttributeNames: {
        '#userId': 'userId',
        '#active': 'active',
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':active': true,
      },
    });

    const items = result.Items as Registration[];
    const total = items.length;

    const startIndex = (page - 1) * limit;
    const paginatedItems = items.slice(startIndex, startIndex + limit);

    return {
      items: paginatedItems,
      total,
    };
  }
}