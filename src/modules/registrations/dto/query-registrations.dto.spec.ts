import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { QueryRegistrationsDto } from './query-registrations.dto';

describe('QueryRegistrationsDto', () => {
  it('should validate a valid DTO with all fields', async () => {
    const dto = plainToInstance(QueryRegistrationsDto, {
      page: 1,
      limit: 10,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate an empty DTO and use default values', async () => {
    const dto = plainToInstance(QueryRegistrationsDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
  });

  it('should fail validation when page is less than 1', async () => {
    const dto = plainToInstance(QueryRegistrationsDto, {
      page: 0,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('page');
    expect(errors[0].constraints).toHaveProperty('min');
  });

  it('should fail validation when page is not an integer', async () => {
    const dto = plainToInstance(QueryRegistrationsDto, {
      page: 1.5,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('page');
    expect(errors[0].constraints).toHaveProperty('isInt');
  });

  it('should fail validation when limit is less than 1', async () => {
    const dto = plainToInstance(QueryRegistrationsDto, {
      limit: 0,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('limit');
    expect(errors[0].constraints).toHaveProperty('min');
  });

  it('should fail validation when limit is greater than 100', async () => {
    const dto = plainToInstance(QueryRegistrationsDto, {
      limit: 101,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('limit');
    expect(errors[0].constraints).toHaveProperty('max');
  });

  it('should fail validation when limit is not an integer', async () => {
    const dto = plainToInstance(QueryRegistrationsDto, {
      limit: 10.5,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('limit');
    expect(errors[0].constraints).toHaveProperty('isInt');
  });
});