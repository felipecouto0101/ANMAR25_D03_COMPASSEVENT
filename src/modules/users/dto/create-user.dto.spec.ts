import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto', () => {
  it('should validate a valid DTO', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
      phone: '+1234567890',
      role: 'participant',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when name is missing', async () => {
    const dto = plainToInstance(CreateUserDto, {
      email: 'test@example.com',
      password: 'Password123',
      phone: '+1234567890',
      role: 'participant',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('name');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation when email is missing', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Test User',
      password: 'Password123',
      phone: '+1234567890',
      role: 'participant',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation when email is invalid', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Test User',
      email: 'invalid-email',
      password: 'Password123',
      phone: '+1234567890',
      role: 'participant',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail validation when password is missing', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1234567890',
      role: 'participant',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation when password is too short', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Pass1',
      phone: '+1234567890',
      role: 'participant',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints).toHaveProperty('minLength');
  });

  it('should fail validation when password format is invalid', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password',
      phone: '+1234567890',
      role: 'participant',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints).toHaveProperty('matches');
  });

  it('should fail validation when phone is missing', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
      role: 'participant',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('phone');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation when phone format is invalid', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
      phone: 'invalid-phone',
      role: 'participant',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('phone');
    expect(errors[0].constraints).toHaveProperty('matches');
  });

  it('should fail validation when role is missing', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
      phone: '+1234567890',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('role');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('should fail validation when role is invalid', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
      phone: '+1234567890',
      role: 'invalid-role',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('role');
    expect(errors[0].constraints).toHaveProperty('isEnum');
  });
});