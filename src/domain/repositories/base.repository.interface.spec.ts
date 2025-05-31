import { BaseRepository } from './base.repository.interface';

describe('BaseRepository Interface', () => {
  class TestEntity {
    id: string;
    name: string;
  }

  class MockRepository implements BaseRepository<TestEntity> {
    private items: TestEntity[] = [];

    async create(item: TestEntity): Promise<TestEntity> {
      this.items.push(item);
      return item;
    }

    async findById(id: string): Promise<TestEntity | null> {
      return this.items.find(item => item.id === id) || null;
    }

    async findAll(): Promise<TestEntity[]> {
      return this.items;
    }

    async update(id: string, item: Partial<TestEntity>): Promise<TestEntity | null> {
      const index = this.items.findIndex(i => i.id === id);
      if (index === -1) return null;
      
      this.items[index] = { ...this.items[index], ...item };
      return this.items[index];
    }

    async delete(id: string): Promise<boolean> {
      const initialLength = this.items.length;
      this.items = this.items.filter(item => item.id !== id);
      return initialLength > this.items.length;
    }
  }

  let repository: MockRepository;
  let testEntity: TestEntity;

  beforeEach(() => {
    repository = new MockRepository();
    testEntity = { id: '1', name: 'Test Entity' };
  });

  it('should create an entity', async () => {
    const result = await repository.create(testEntity);
    expect(result).toEqual(testEntity);
    
    const allItems = await repository.findAll();
    expect(allItems).toContainEqual(testEntity);
  });

  it('should find an entity by id', async () => {
    await repository.create(testEntity);
    
    const result = await repository.findById('1');
    expect(result).toEqual(testEntity);
    
    const notFound = await repository.findById('999');
    expect(notFound).toBeNull();
  });

  it('should find all entities', async () => {
    const entity1 = { id: '1', name: 'Entity 1' };
    const entity2 = { id: '2', name: 'Entity 2' };
    
    await repository.create(entity1);
    await repository.create(entity2);
    
    const result = await repository.findAll();
    expect(result).toHaveLength(2);
    expect(result).toContainEqual(entity1);
    expect(result).toContainEqual(entity2);
  });

  it('should update an entity', async () => {
    await repository.create(testEntity);
    
    const updated = await repository.update('1', { name: 'Updated Name' });
    expect(updated).toEqual({ id: '1', name: 'Updated Name' });
    
    const result = await repository.findById('1');
    expect(result).toEqual({ id: '1', name: 'Updated Name' });
    
    const notFound = await repository.update('999', { name: 'Not Found' });
    expect(notFound).toBeNull();
  });

  it('should delete an entity', async () => {
    await repository.create(testEntity);
    
    const result = await repository.delete('1');
    expect(result).toBe(true);
    
    const allItems = await repository.findAll();
    expect(allItems).toHaveLength(0);
    
    const notFound = await repository.delete('999');
    expect(notFound).toBe(false);
  });
});