import { RegistrationResponseDto } from './registration-response.dto';
import { Registration } from '../../../domain/entities/registration.entity';
import { Event } from '../../../domain/entities/event.entity';

describe('RegistrationResponseDto', () => {
  it('should create a DTO from registration and event entities', () => {
    const registration: Registration = {
      id: 'registration-id',
      userId: 'user-id',
      eventId: 'event-id',
      active: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    };

    const event: Event = {
      id: 'event-id',
      name: 'Test Event',
      description: 'Test Description',
      date: '2025-12-15T09:00:00.000Z',
      location: 'Test Location',
      imageUrl: 'http://example.com/image.jpg',
      organizerId: 'organizer-id',
      active: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    };

    const dto = new RegistrationResponseDto(registration, event);

    expect(dto.id).toBe('registration-id');
    expect(dto.userId).toBe('user-id');
    expect(dto.createdAt).toBe('2023-01-01T00:00:00.000Z');
    expect(dto.event).toBeDefined();
    expect(dto.event.id).toBe('event-id');
    expect(dto.event.name).toBe('Test Event');
    expect(dto.event.description).toBe('Test Description');
    expect(dto.event.date).toBe('2025-12-15T09:00:00.000Z');
    expect(dto.event.location).toBe('Test Location');
    expect(dto.event.imageUrl).toBe('http://example.com/image.jpg');
  });

  it('should handle event without imageUrl', () => {
    const registration: Registration = {
      id: 'registration-id',
      userId: 'user-id',
      eventId: 'event-id',
      active: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    };

    const event: Event = {
      id: 'event-id',
      name: 'Test Event',
      description: 'Test Description',
      date: '2025-12-15T09:00:00.000Z',
      location: 'Test Location',
      organizerId: 'organizer-id',
      active: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    };

    const dto = new RegistrationResponseDto(registration, event);

    expect(dto.event.imageUrl).toBeUndefined();
  });
});