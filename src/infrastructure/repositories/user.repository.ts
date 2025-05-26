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
}