import { BaseDynamoDBRepository } from './base.dynamodb.repository';
import { DynamoDBService } from '../database/dynamodb/dynamodb.service';

class TestEntity {
  id: string;
  name: string;
}

class TestRepository extends BaseDynamoDBRepository<TestEntity> {
  protected tableName = 'TestTable';
  protected primaryKey = 'id';
}

describe('BaseDynamoDBRepository', () => {
  let repository: TestRepository;
  let dynamoDBService: DynamoDBService;

  beforeEach(() => {
    dynamoDBService = {
      put: jest.fn(),
      get: jest.fn(),
      scan: jest.fn(),
      delete: jest.fn(),
    } as any;

    repository = new TestRepository(dynamoDBService);
  });

  describe('create', () => {
    it('should put item in DynamoDB and return it', async () => {
      const item: TestEntity = { id: '1', name: 'Test Entity' };
      
      dynamoDBService.put = jest.fn().mockResolvedValueOnce({});
      
      const result = await repository.create(item);
      
      expect(dynamoDBService.put).toHaveBeenCalledWith({
        TableName: 'TestTable',
        Item: item,
      });
      expect(result).toBe(item);
    });
  });

  describe('findById', () => {
    it('should get item by id from DynamoDB', async () => {
      const item: TestEntity = { id: '1', name: 'Test Entity' };
      
      dynamoDBService.get = jest.fn().mockResolvedValueOnce({ Item: item });
      
      const result = await repository.findById('1');
      
      expect(dynamoDBService.get).toHaveBeenCalledWith({
        TableName: 'TestTable',
        Key: { id: '1' },
      });
      expect(result).toBe(item);
    });

    it('should return null when item is not found', async () => {
      dynamoDBService.get = jest.fn().mockResolvedValueOnce({});
      
      const result = await repository.findById('1');
      
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should scan all items from DynamoDB', async () => {
      const items: TestEntity[] = [
        { id: '1', name: 'Entity 1' },
        { id: '2', name: 'Entity 2' },
      ];
      
      dynamoDBService.scan = jest.fn().mockResolvedValueOnce({ Items: items });
      
      const result = await repository.findAll();
      
      expect(dynamoDBService.scan).toHaveBeenCalledWith({
        TableName: 'TestTable',
      });
      expect(result).toEqual(items);
    });

    it('should return empty array when no items are found', async () => {
      dynamoDBService.scan = jest.fn().mockResolvedValueOnce({});
      
      const result = await repository.findAll();
      
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update existing item in DynamoDB', async () => {
      const existingItem: TestEntity = { id: '1', name: 'Old Name' };
      const updatedItem: TestEntity = { id: '1', name: 'New Name' };
      
      jest.spyOn(repository, 'findById').mockResolvedValueOnce(existingItem);
      dynamoDBService.put = jest.fn().mockResolvedValueOnce({});
      
      const result = await repository.update('1', { name: 'New Name' });
      
      expect(repository.findById).toHaveBeenCalledWith('1');
      expect(dynamoDBService.put).toHaveBeenCalledWith({
        TableName: 'TestTable',
        Item: updatedItem,
      });
      expect(result).toEqual(updatedItem);
    });

    it('should return null when item to update is not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValueOnce(null);
      
      const result = await repository.update('1', { name: 'New Name' });
      
      expect(repository.findById).toHaveBeenCalledWith('1');
      expect(dynamoDBService.put).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete item from DynamoDB', async () => {
      dynamoDBService.delete = jest.fn().mockResolvedValueOnce({});
      
      const result = await repository.delete('1');
      
      expect(dynamoDBService.delete).toHaveBeenCalledWith({
        TableName: 'TestTable',
        Key: { id: '1' },
      });
      expect(result).toBe(true);
    });
  });
});