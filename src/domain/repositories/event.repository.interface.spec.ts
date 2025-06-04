import { EventRepository } from './event.repository.interface';
import { Event } from '../entities/event.entity';

describe('EventRepository Interface', () => {
  class MockEventRepository implements EventRepository {
    private events: Event[] = [];

    async create(event: Event): Promise<Event> {
      this.events.push(event);
      return event;
    }

    async findById(id: string): Promise<Event | null> {
      return this.events.find(event => event.id === id) || null;
    }

    async findAll(): Promise<Event[]> {
      return this.events;
    }

    async update(id: string, event: Partial<Event>): Promise<Event | null> {
      const index = this.events.findIndex(e => e.id === id);
      if (index === -1) return null;
      
      this.events[index] = { ...this.events[index], ...event };
      return this.events[index];
    }

    async delete(id: string): Promise<boolean> {
      const initialLength = this.events.length;
      this.events = this.events.filter(event => event.id !== id);
      return initialLength > this.events.length;
    }

    async findByDate(date: string): Promise<Event[]> {
      const targetDate = new Date(date).toISOString().split('T')[0];
      return this.events.filter(event => {
        const eventDate = new Date(event.date).toISOString().split('T')[0];
        return eventDate === targetDate;
      });
    }

    async findByName(name: string): Promise<Event | null> {
      return this.events.find(event => 
        event.name.toLowerCase() === name.toLowerCase()
      ) || null;
    }

    async findWithFilters(filters: {
      name?: string;
      startDate?: string;
      endDate?: string;
      active?: boolean;
      page: number;
      limit: number;
    }): Promise<{ items: Event[]; total: number }> {
      let filteredEvents = [...this.events];
      
      if (filters.name) {
        filteredEvents = filteredEvents.filter(event => 
          event.name.toLowerCase().includes(filters.name!.toLowerCase())
        );
      }
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= startDate || 
                 eventDate.toISOString().split('T')[0] === startDate.toISOString().split('T')[0];
        });
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        filteredEvents = filteredEvents.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate <= endDate || 
                 eventDate.toISOString().split('T')[0] === endDate.toISOString().split('T')[0];
        });
      }
      
      if (filters.active !== undefined) {
        filteredEvents = filteredEvents.filter(event => event.active === filters.active);
      }
      
      const total = filteredEvents.length;
      const start = (filters.page - 1) * filters.limit;
      const end = start + filters.limit;
      const items = filteredEvents.slice(start, end);
      
      return { items, total };
    }
  }

  let repository: MockEventRepository;
  let testEvent: Event;

  beforeEach(() => {
    repository = new MockEventRepository();
    testEvent = {
      id: '1',
      name: 'Tech Conference',
      description: 'A conference about technology',
      date: '2023-12-15T09:00:00.000Z',
      location: 'Convention Center',
      organizerId: 'organizer-id',
      active: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    };
  });

  it('should find events by date', async () => {
    const event1 = { ...testEvent, id: '1', date: '2023-12-15T09:00:00.000Z' };
    const event2 = { ...testEvent, id: '2', date: '2023-12-15T14:00:00.000Z' };
    const event3 = { ...testEvent, id: '3', date: '2023-12-16T09:00:00.000Z' };
    
    await repository.create(event1);
    await repository.create(event2);
    await repository.create(event3);
    
    const result = await repository.findByDate('2023-12-15');
    expect(result).toHaveLength(2);
    expect(result.map(e => e.id)).toContain('1');
    expect(result.map(e => e.id)).toContain('2');
    
    const emptyResult = await repository.findByDate('2023-12-17');
    expect(emptyResult).toHaveLength(0);
  });

  it('should find an event by name', async () => {
    const event1 = { ...testEvent, id: '1', name: 'Tech Conference' };
    const event2 = { ...testEvent, id: '2', name: 'Code Workshop' };
    
    await repository.create(event1);
    await repository.create(event2);
    
    const result = await repository.findByName('Tech Conference');
    expect(result).toEqual(event1);
    
    const caseInsensitive = await repository.findByName('tech conference');
    expect(caseInsensitive).toEqual(event1);
    
    const notFound = await repository.findByName('Non-existent Event');
    expect(notFound).toBeNull();
  });

  it('should find events with filters', async () => {
    const event1 = { ...testEvent, id: '1', name: 'Tech Conference', date: '2023-12-15T09:00:00.000Z', active: true };
    const event2 = { ...testEvent, id: '2', name: 'Code Workshop', date: '2023-12-16T09:00:00.000Z', active: true };
    const event3 = { ...testEvent, id: '3', name: 'Design Meetup', date: '2023-12-17T09:00:00.000Z', active: false };
    
    await repository.create(event1);
    await repository.create(event2);
    await repository.create(event3);
    
 
    let result = await repository.findWithFilters({ name: 'Tech', page: 1, limit: 10 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.items[0].id).toBe('1');
    
    
    result = await repository.findWithFilters({ 
      startDate: '2023-12-15', 
      endDate: '2023-12-16', 
      page: 1, 
      limit: 10 
    });
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    
    
    result = await repository.findWithFilters({ active: false, page: 1, limit: 10 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.items[0].id).toBe('3');
    
  
    result = await repository.findWithFilters({ page: 1, limit: 2 });
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(3);
    
    result = await repository.findWithFilters({ page: 2, limit: 2 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(3);
  });
});