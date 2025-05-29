import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { QueryEventsDto } from './query-events.dto';

describe('QueryEventsDto', () => {
  it('should validate a valid DTO with all fields', async () => {
    const dto = plainToInstance(QueryEventsDto, {
      name: 'Event',
      startDate: '2023-01-01T00:00:00.000Z',
      endDate: '2025-12-31T23:59:59.999Z',
      active: true,
      page: 1,
      limit: 10,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with partial fields', async () => {
    const dto = plainToInstance(QueryEventsDto, {
      name: 'Event',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate an empty DTO', async () => {
    const dto = plainToInstance(QueryEventsDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should use default values for page and limit when not provided', () => {
    const dto = plainToInstance(QueryEventsDto, {});

    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
  });

  it('should fail validation when name is not a string', async () => {
    const dto = plainToInstance(QueryEventsDto, {
      name: 123,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
  });

  it('should fail validation when startDate is invalid', async () => {
    const dto = plainToInstance(QueryEventsDto, {
      startDate: 'invalid-date',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('startDate');
  });

  it('should fail validation when endDate is invalid', async () => {
    const dto = plainToInstance(QueryEventsDto, {
      endDate: 'invalid-date',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('endDate');
  });

  it('should fail validation when active is not a boolean', async () => {
    const dto = plainToInstance(QueryEventsDto, {
      active: 'yes',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('active');
  });

  it('should fail validation when page is less than 1', async () => {
    const dto = plainToInstance(QueryEventsDto, {
      page: 0,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('page');
  });

  it('should fail validation when page is not an integer', async () => {
    const dto = plainToInstance(QueryEventsDto, {
      page: 1.5,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('page');
  });

  it('should fail validation when limit is less than 1', async () => {
    const dto = plainToInstance(QueryEventsDto, {
      limit: 0,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('limit');
  });

  it('should fail validation when limit is greater than 100', async () => {
    const dto = plainToInstance(QueryEventsDto, {
      limit: 101,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('limit');
  });

  it('should fail validation when limit is not an integer', async () => {
    const dto = plainToInstance(QueryEventsDto, {
      limit: 10.5,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('limit');
  });
});