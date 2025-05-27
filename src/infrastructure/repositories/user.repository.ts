import { Injectable } from '@nestjs/common';
import { BaseDynamoDBRepository } from './base.dynamodb.repository';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { DynamoDBService } from '../database/dynamodb/dynamodb.service';

@Injectable()
export class UserDynamoDBRepository extends BaseDynamoDBRepository<User> implements UserRepository {
  protected tableName = 'Users';
  protected primaryKey = 'id';

  constructor(dynamoDBService: DynamoDBService) {
    super(dynamoDBService);
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.dynamoDBService.scan({
      TableName: this.tableName,
      FilterExpression: '#email = :email',
      ExpressionAttributeNames: {
        '#email': 'email',
      },
      ExpressionAttributeValues: {
        ':email': email,
      },
    });

    const items = result.Items as User[];
    return items && items.length > 0 ? items[0] : null;
  }

  async findWithFilters(filters: {
    name?: string;
    email?: string;
    role?: string;
    active?: boolean;
    page: number;
    limit: number;
  }): Promise<{ items: User[]; total: number }> {
    let filterExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    if (filters.name) {
      filterExpressions.push('contains(#name, :name)');
      expressionAttributeNames['#name'] = 'name';
      expressionAttributeValues[':name'] = filters.name;
    }

    if (filters.email) {
      filterExpressions.push('contains(#email, :email)');
      expressionAttributeNames['#email'] = 'email';
      expressionAttributeValues[':email'] = filters.email;
    }

    if (filters.role) {
      filterExpressions.push('#role = :role');
      expressionAttributeNames['#role'] = 'role';
      expressionAttributeValues[':role'] = filters.role;
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
    const items = result.Items as User[];
    const total = items.length;

    
    const startIndex = (filters.page - 1) * filters.limit;
    const paginatedItems = items.slice(startIndex, startIndex + filters.limit);

    return {
      items: paginatedItems,
      total,
    };
  }
}