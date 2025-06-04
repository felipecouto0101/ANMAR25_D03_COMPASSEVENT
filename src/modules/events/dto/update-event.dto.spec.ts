import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateEventDto } from './update-event.dto';

describe('UpdateEventDto', () => {
  it('should validate a valid DTO with all fields', async () => {
    const dto = plainToInstance(UpdateEventDto, {
      name: 'Updated Event',
      description: 'Updated Description',
      date: '2025-12-15T09:00:00.000Z',
      location: 'Updated Location',
      organizerId: 'organizer-id',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with partial fields', async () => {
    const dto = plainToInstance(UpdateEventDto, {
      name: 'Updated Event',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate an empty DTO', async () => {
    const dto = plainToInstance(UpdateEventDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when name is not a string', async () => {
    const dto = plainToInstance(UpdateEventDto, {
      name: 123,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });

  it('should fail validation when description is not a string', async () => {
    const dto = plainToInstance(UpdateEventDto, {
      description: 123,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('description');
  });

  it('should fail validation when date is invalid', async () => {
    const dto = plainToInstance(UpdateEventDto, {
      date: 'invalid-date',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('date');
  });

  it('should fail validation when location is not a string', async () => {
    const dto = plainToInstance(UpdateEventDto, {
      location: 123,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('location');
  });

  it('should fail validation when organizerId is not a string', async () => {
    const dto = plainToInstance(UpdateEventDto, {
      organizerId: 123,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('organizerId');
  });
});