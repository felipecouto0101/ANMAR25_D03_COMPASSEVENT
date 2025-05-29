import { CustomValidationPipe } from './validation.pipe';
import { ArgumentMetadata } from '@nestjs/common';
import { ValidationException } from '../../domain/exceptions/domain.exceptions';


jest.mock('class-validator', () => ({
  validate: jest.fn(),
}));

jest.mock('class-transformer', () => ({
  plainToClass: jest.fn().mockImplementation((metatype, value) => value),
}));


import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

class TestDto {
  property: string;
}

class CreateRegistrationDto {
  eventId: string;
}

describe('CustomValidationPipe', () => {
  let pipe: CustomValidationPipe;
  let metadata: ArgumentMetadata;

  beforeEach(() => {
    pipe = new CustomValidationPipe();
    metadata = {
      type: 'body',
      metatype: TestDto,
      data: '',
    };
    (validate as jest.Mock).mockReset();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should return value when no metatype is provided', async () => {
    const value = { property: 'test' };
    const result = await pipe.transform(value, { ...metadata, metatype: undefined });
    expect(result).toBe(value);
  });

  it('should return value when metatype is a primitive type', async () => {
    const value = 'test';
    const result = await pipe.transform(value, { ...metadata, metatype: String });
    expect(result).toBe(value);
  });

  it('should return value when validation passes', async () => {
    const value = { property: 'test' };
    (validate as jest.Mock).mockResolvedValueOnce([]);
    
    const result = await pipe.transform(value, metadata);
    
    expect(plainToClass).toHaveBeenCalledWith(TestDto, value);
    expect(validate).toHaveBeenCalled();
    expect(result).toBe(value);
  });

  it('should throw ValidationException when validation fails', async () => {
    const value = { property: 'test' };
    (validate as jest.Mock).mockResolvedValueOnce([
      {
        property: 'property',
        constraints: {
          isString: 'property must be a string',
          isNotEmpty: 'property should not be empty',
        },
      },
    ]);
    
    await expect(pipe.transform(value, metadata)).rejects.toThrow(ValidationException);
    expect(plainToClass).toHaveBeenCalledWith(TestDto, value);
    expect(validate).toHaveBeenCalled();
  });

  it('should include example for CreateRegistrationDto', async () => {
    const value = { eventId: 'invalid-id' };
    (validate as jest.Mock).mockResolvedValueOnce([
      {
        property: 'eventId',
        constraints: {
          isUuid: 'eventId must be a UUID',
        },
      },
    ]);
    
    try {
      await pipe.transform(value, { ...metadata, metatype: CreateRegistrationDto });
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationException);
      expect(error.example).toEqual({ eventId: '550e8400-e29b-41d4-a716-446655440000' });
    }
  });

  it('should handle errors without constraints', async () => {
    const value = { property: 'test' };
    (validate as jest.Mock).mockResolvedValueOnce([
      {
        property: 'property',
      },
    ]);
    
    await expect(pipe.transform(value, metadata)).rejects.toThrow(ValidationException);
  });
});