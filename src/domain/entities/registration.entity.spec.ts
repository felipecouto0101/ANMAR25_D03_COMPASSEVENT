import { Registration } from './registration.entity';

describe('Registration Entity', () => {
  it('should create a registration instance', () => {
    const registration = new Registration();
    expect(registration).toBeDefined();
  });

  it('should have all required properties', () => {
    const registration = new Registration();
    registration.id = 'registration-id';
    registration.userId = 'user-id';
    registration.eventId = 'event-id';
    registration.active = true;
    registration.createdAt = '2023-01-01T00:00:00.000Z';
    registration.updatedAt = '2023-01-01T00:00:00.000Z';

    expect(registration.id).toBe('registration-id');
    expect(registration.userId).toBe('user-id');
    expect(registration.eventId).toBe('event-id');
    expect(registration.active).toBe(true);
    expect(registration.createdAt).toBe('2023-01-01T00:00:00.000Z');
    expect(registration.updatedAt).toBe('2023-01-01T00:00:00.000Z');
  });

  it('should allow setting active status', () => {
    const registration = new Registration();
    registration.active = true;
    expect(registration.active).toBe(true);
    
    registration.active = false;
    expect(registration.active).toBe(false);
  });

  it('should store timestamps as ISO strings', () => {
    const registration = new Registration();
    const dateString = '2023-01-01T00:00:00.000Z';
    
    registration.createdAt = dateString;
    registration.updatedAt = dateString;
    
    expect(registration.createdAt).toBe(dateString);
    expect(registration.updatedAt).toBe(dateString);
    expect(new Date(registration.createdAt).toISOString()).toBe(dateString);
    expect(new Date(registration.updatedAt).toISOString()).toBe(dateString);
  });
});