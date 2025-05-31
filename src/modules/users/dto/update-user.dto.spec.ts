import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateUserDto } from './update-user.dto';

describe('UpdateUserDto', () => {
  it('should validate a valid DTO with all fields', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      name: 'Updated User',
      email: 'updated@example.com',
      password: 'Password123',
      phone: '+1234567890',
      role: 'organizer',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid DTO with partial fields', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      name: 'Updated User',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate an empty DTO', async () => {
    const dto = plainToInstance(UpdateUserDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation when email is invalid', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      email: 'invalid-email',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail validation when password is too short', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      password: 'Pass1',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints).toHaveProperty('minLength');
  });

  it('should fail validation when password format is invalid', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      password: 'password',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints).toHaveProperty('matches');
  });

  it('should fail validation when phone format is invalid', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      phone: 'invalid-phone',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('phone');
    expect(errors[0].constraints).toHaveProperty('matches');
  });

  it('should fail validation when role is invalid', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      role: 'admin',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('role');
    expect(errors[0].constraints).toHaveProperty('isEnum');
  });

  it('should validate when role is organizer', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      role: 'organizer',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate when role is participant', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      role: 'participant',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});