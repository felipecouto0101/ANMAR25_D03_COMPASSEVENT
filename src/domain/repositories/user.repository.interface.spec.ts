import { UserRepository } from './user.repository.interface';
import { User } from '../entities/user.entity';

describe('UserRepository Interface', () => {
  class MockUserRepository implements UserRepository {
    private users: User[] = [];

    async create(user: User): Promise<User> {
      this.users.push(user);
      return user;
    }

    async findById(id: string): Promise<User | null> {
      return this.users.find(user => user.id === id) || null;
    }

    async findAll(): Promise<User[]> {
      return this.users;
    }

    async update(id: string, user: Partial<User>): Promise<User | null> {
      const index = this.users.findIndex(u => u.id === id);
      if (index === -1) return null;
      
      this.users[index] = { ...this.users[index], ...user };
      return this.users[index];
    }

    async delete(id: string): Promise<boolean> {
      const initialLength = this.users.length;
      this.users = this.users.filter(user => user.id !== id);
      return initialLength > this.users.length;
    }

    async findByEmail(email: string): Promise<User | null> {
      return this.users.find(user => user.email === email) || null;
    }

    async findWithFilters(filters: {
      name?: string;
      email?: string;
      role?: string;
      active?: boolean;
      page: number;
      limit: number;
    }): Promise<{ items: User[]; total: number }> {
      let filteredUsers = [...this.users];
      
      if (filters.name) {
        filteredUsers = filteredUsers.filter(user => 
          user.name.toLowerCase().includes(filters.name!.toLowerCase())
        );
      }
      
      if (filters.email) {
        filteredUsers = filteredUsers.filter(user => 
          user.email.toLowerCase().includes(filters.email!.toLowerCase())
        );
      }
      
      if (filters.role) {
        filteredUsers = filteredUsers.filter(user => user.role === filters.role);
      }
      
      if (filters.active !== undefined) {
        filteredUsers = filteredUsers.filter(user => user.active === filters.active);
      }
      
      const total = filteredUsers.length;
      const start = (filters.page - 1) * filters.limit;
      const end = start + filters.limit;
      const items = filteredUsers.slice(start, end);
      
      return { items, total };
    }
  }

  let repository: MockUserRepository;
  let testUser: User;

  beforeEach(() => {
    repository = new MockUserRepository();
    testUser = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedPassword',
      phone: '+1234567890',
      role: 'participant',
      emailVerified: false,
      active: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    };
  });

  it('should find a user by email', async () => {
    await repository.create(testUser);
    
    const result = await repository.findByEmail('john@example.com');
    expect(result).toEqual(testUser);
    
    const notFound = await repository.findByEmail('notfound@example.com');
    expect(notFound).toBeNull();
  });

  it('should find users with filters', async () => {
    const user1 = { ...testUser, id: '1', name: 'John Doe', email: 'john@example.com', role: 'participant' as const };
    const user2 = { ...testUser, id: '2', name: 'Jane Doe', email: 'jane@example.com', role: 'organizer' as const };
    const user3 = { ...testUser, id: '3', name: 'Admin User', email: 'admin@example.com', role: 'admin' as const };
    const user4 = { ...testUser, id: '4', name: 'Inactive User', email: 'inactive@example.com', active: false };
    
    await repository.create(user1);
    await repository.create(user2);
    await repository.create(user3);
    await repository.create(user4);
    
   
    let result = await repository.findWithFilters({ name: 'John', page: 1, limit: 10 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.items[0].id).toBe('1');
    
    
    result = await repository.findWithFilters({ email: 'jane', page: 1, limit: 10 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.items[0].id).toBe('2');
    
    
    result = await repository.findWithFilters({ role: 'admin', page: 1, limit: 10 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.items[0].id).toBe('3');
    
    
    result = await repository.findWithFilters({ active: false, page: 1, limit: 10 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.items[0].id).toBe('4');
    
    
    result = await repository.findWithFilters({ page: 1, limit: 2 });
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(4);
    
    result = await repository.findWithFilters({ page: 2, limit: 2 });
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(4);
    
    result = await repository.findWithFilters({ page: 3, limit: 2 });
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(4);
  });
});