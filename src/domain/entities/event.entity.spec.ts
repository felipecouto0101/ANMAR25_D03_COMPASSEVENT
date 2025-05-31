import { Event } from './event.entity';

describe('Event Entity', () => {
  it('should create an event instance', () => {
    const event = new Event();
    expect(event).toBeDefined();
  });

  it('should have all required properties', () => {
    const event = new Event();
    event.id = 'event-id';
    event.name = 'Tech Conference';
    event.description = 'A conference about technology';
    event.date = '2023-12-15T09:00:00.000Z';
    event.location = 'Convention Center';
    event.organizerId = 'organizer-id';
    event.active = true;
    event.createdAt = '2023-01-01T00:00:00.000Z';
    event.updatedAt = '2023-01-01T00:00:00.000Z';

    expect(event.id).toBe('event-id');
    expect(event.name).toBe('Tech Conference');
    expect(event.description).toBe('A conference about technology');
    expect(event.date).toBe('2023-12-15T09:00:00.000Z');
    expect(event.location).toBe('Convention Center');
    expect(event.organizerId).toBe('organizer-id');
    expect(event.active).toBe(true);
    expect(event.createdAt).toBe('2023-01-01T00:00:00.000Z');
    expect(event.updatedAt).toBe('2023-01-01T00:00:00.000Z');
  });

  it('should allow optional imageUrl', () => {
    const event = new Event();
    event.id = 'event-id';
    event.name = 'Tech Conference';
    event.description = 'A conference about technology';
    event.date = '2023-12-15T09:00:00.000Z';
    event.location = 'Convention Center';
    event.organizerId = 'organizer-id';
    event.imageUrl = 'http://example.com/image.jpg';
    event.active = true;
    event.createdAt = '2023-01-01T00:00:00.000Z';
    event.updatedAt = '2023-01-01T00:00:00.000Z';

    expect(event.imageUrl).toBe('http://example.com/image.jpg');
  });

  it('should handle date as ISO string', () => {
    const event = new Event();
    const dateString = '2023-12-15T09:00:00.000Z';
    event.date = dateString;

    expect(event.date).toBe(dateString);
    expect(new Date(event.date).toISOString()).toBe(dateString);
  });
});