import { BaseRepository } from '../../domain/repositories/base.repository.interface';
import { DynamoDBService } from '../database/dynamodb/dynamodb.service';

export abstract class BaseDynamoDBRepository<T> implements BaseRepository<T> {
  protected abstract tableName: string;
  protected abstract primaryKey: string;

  constructor(protected readonly dynamoDBService: DynamoDBService) {}

  async create(item: T): Promise<T> {
    await this.dynamoDBService.put({
      TableName: this.tableName,
      Item: item as Record<string, any>,
    });
    return item;
  }

  async findById(id: string): Promise<T | null> {
    const result = await this.dynamoDBService.get({
      TableName: this.tableName,
      Key: { [this.primaryKey]: id },
    });
    
    return result.Item as T || null;
  }

  async findAll(): Promise<T[]> {
    const result = await this.dynamoDBService.scan({
      TableName: this.tableName,
    });
    
    return (result.Items || []) as T[];
  }

  async update(id: string, item: Partial<T>): Promise<T | null> {
    const existingItem = await this.findById(id);
    
    if (!existingItem) {
      return null;
    }
    
    const updatedItem = { ...existingItem, ...item };
    
    await this.dynamoDBService.put({
      TableName: this.tableName,
      Item: updatedItem as Record<string, any>,
    });
    
    return updatedItem;
  }

  async delete(id: string): Promise<boolean> {
    await this.dynamoDBService.delete({
      TableName: this.tableName,
      Key: { [this.primaryKey]: id },
    });
    
    return true;
  }
}