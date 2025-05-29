import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateRegistrationDto } from './create-registration.dto';

describe('CreateRegistrationDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = plainToInstance(CreateRegistrationDto, {
      eventId: '550e8400-e29b-41d4-a716-446655440000',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when eventId is missing', async () => {
    const dto = plainToInstance(CreateRegistrationDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('eventId');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation when eventId is not a string', async () => {
    const dto = plainToInstance(CreateRegistrationDto, {
      eventId: 123,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('eventId');
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('should fail validation when eventId is not a valid UUID', async () => {
    const dto = plainToInstance(CreateRegistrationDto, {
      eventId: 'not-a-uuid',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('eventId');
    expect(errors[0].constraints).toHaveProperty('isUuid');
  });
});