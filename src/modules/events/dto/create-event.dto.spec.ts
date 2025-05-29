import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateEventDto } from './create-event.dto';

describe('CreateEventDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = plainToInstance(CreateEventDto, {
      name: 'Test Event',
      description: 'Test Description',
      date: '2025-12-15T09:00:00.000Z',
      location: 'Test Location',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when name is missing', async () => {
    const dto = plainToInstance(CreateEventDto, {
      description: 'Test Description',
      date: '2025-12-15T09:00:00.000Z',
      location: 'Test Location',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });

  it('should fail validation when description is missing', async () => {
    const dto = plainToInstance(CreateEventDto, {
      name: 'Test Event',
      date: '2025-12-15T09:00:00.000Z',
      location: 'Test Location',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('description');
  });

  it('should fail validation when date is missing', async () => {
    const dto = plainToInstance(CreateEventDto, {
      name: 'Test Event',
      description: 'Test Description',
      location: 'Test Location',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('date');
  });

  it('should fail validation when date is invalid', async () => {
    const dto = plainToInstance(CreateEventDto, {
      name: 'Test Event',
      description: 'Test Description',
      date: 'invalid-date',
      location: 'Test Location',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('date');
  });

  it('should fail validation when location is missing', async () => {
    const dto = plainToInstance(CreateEventDto, {
      name: 'Test Event',
      description: 'Test Description',
      date: '2025-12-15T09:00:00.000Z',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('location');
  });
});