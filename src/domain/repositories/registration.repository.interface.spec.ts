import { RegistrationRepository } from './registration.repository.interface';
import { Registration } from '../entities/registration.entity';

describe('RegistrationRepository Interface', () => {
  class MockRegistrationRepository implements RegistrationRepository {
    private registrations: Registration[] = [];

    async create(registration: Registration): Promise<Registration> {
      this.registrations.push(registration);
      return registration;
    }

    async findById(id: string): Promise<Registration | null> {
      return this.registrations.find(registration => registration.id === id) || null;
    }

    async findAll(): Promise<Registration[]> {
      return this.registrations;
    }

    async update(id: string, registration: Partial<Registration>): Promise<Registration | null> {
      const index = this.registrations.findIndex(r => r.id === id);
      if (index === -1) return null;
      
      this.registrations[index] = { ...this.registrations[index], ...registration };
      return this.registrations[index];
    }

    async delete(id: string): Promise<boolean> {
      const initialLength = this.registrations.length;
      this.registrations = this.registrations.filter(registration => registration.id !== id);
      return initialLength > this.registrations.length;
    }

    async findByUserAndEvent(userId: string, eventId: string): Promise<Registration | null> {
      return this.registrations.find(registration => 
        registration.userId === userId && registration.eventId === eventId
      ) || null;
    }

    async findByUser(userId: string, page: number, limit: number): Promise<{ items: Registration[]; total: number }> {
      const filteredRegistrations = this.registrations.filter(registration => registration.userId === userId);
      
      const total = filteredRegistrations.length;
      const start = (page - 1) * limit;
      const end = start + limit;
      const items = filteredRegistrations.slice(start, end);
      
      return { items, total };
    }
  }

  let repository: MockRegistrationRepository;
  let testRegistration: Registration;

  beforeEach(() => {
    repository = new MockRegistrationRepository();
    testRegistration = {
      id: '1',
      userId: 'user-id',
      eventId: 'event-id',
      active: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    };
  });

  it('should find registration by user and event', async () => {
    const registration1 = { ...testRegistration, id: '1', userId: 'user-1', eventId: 'event-1' };
    const registration2 = { ...testRegistration, id: '2', userId: 'user-1', eventId: 'event-2' };
    const registration3 = { ...testRegistration, id: '3', userId: 'user-2', eventId: 'event-1' };
    
    await repository.create(registration1);
    await repository.create(registration2);
    await repository.create(registration3);
    
    const result = await repository.findByUserAndEvent('user-1', 'event-1');
    expect(result).toEqual(registration1);
    
    const notFound = await repository.findByUserAndEvent('user-2', 'event-2');
    expect(notFound).toBeNull();
  });

  it('should find registrations by user with pagination', async () => {
    const registration1 = { ...testRegistration, id: '1', userId: 'user-1', eventId: 'event-1' };
    const registration2 = { ...testRegistration, id: '2', userId: 'user-1', eventId: 'event-2' };
    const registration3 = { ...testRegistration, id: '3', userId: 'user-1', eventId: 'event-3' };
    const registration4 = { ...testRegistration, id: '4', userId: 'user-2', eventId: 'event-1' };
    
    await repository.create(registration1);
    await repository.create(registration2);
    await repository.create(registration3);
    await repository.create(registration4);
    
    
    let result = await repository.findByUser('user-1', 1, 10);
    expect(result.items).toHaveLength(3);
    expect(result.total).toBe(3);
    

    result = await repository.findByUser('user-1', 1, 2);
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(3);
    
    result = await repository.findByUser('user-1', 2, 2);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(3);
    
    
    result = await repository.findByUser('non-existent-user', 1, 10);
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});