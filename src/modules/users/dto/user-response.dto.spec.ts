import { UserResponseDto } from './user-response.dto';
import { User } from '../../../domain/entities/user.entity';

describe('UserResponseDto', () => {
  it('should create a DTO from user entity', () => {
    const user: User = {
      id: 'user-id',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedPassword123',
      phone: '+1234567890',
      role: 'participant',
      profileImageUrl: 'http://example.com/image.jpg',
      emailVerified: false,
      active: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    };

    const dto = new UserResponseDto(user);

    expect(dto.id).toBe('user-id');
    expect(dto.name).toBe('Test User');
    expect(dto.email).toBe('test@example.com');
    expect(dto.phone).toBe('+1234567890');
    expect(dto.role).toBe('participant');
    expect(dto.profileImageUrl).toBe('http://example.com/image.jpg');
    expect(dto.emailVerified).toBe(false);
    expect(dto.active).toBe(true);
    expect(dto.createdAt).toBe('2023-01-01T00:00:00.000Z');
    expect(dto.updatedAt).toBe('2023-01-01T00:00:00.000Z');
  });

  it('should handle user without profile image', () => {
    const user: User = {
      id: 'user-id',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedPassword123',
      phone: '+1234567890',
      role: 'participant',
      emailVerified: false,
      active: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    };

    const dto = new UserResponseDto(user);

    expect(dto.profileImageUrl).toBeUndefined();
  });

  it('should not include password in the response', () => {
    const user: User = {
      id: 'user-id',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedPassword123',
      phone: '+1234567890',
      role: 'participant',
      emailVerified: false,
      active: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    };

    const dto = new UserResponseDto(user);

    expect((dto as any).password).toBeUndefined();
  });
});