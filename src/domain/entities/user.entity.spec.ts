import { User } from './user.entity';

describe('User Entity', () => {
  it('should create a user instance', () => {
    const user = new User();
    expect(user).toBeDefined();
  });

  it('should have all required properties', () => {
    const user = new User();
    user.id = 'user-id';
    user.name = 'John Doe';
    user.email = 'john@example.com';
    user.password = 'hashedPassword';
    user.phone = '+1234567890';
    user.role = 'participant';
    user.emailVerified = false;
    user.active = true;
    user.createdAt = '2023-01-01T00:00:00.000Z';
    user.updatedAt = '2023-01-01T00:00:00.000Z';

    expect(user.id).toBe('user-id');
    expect(user.name).toBe('John Doe');
    expect(user.email).toBe('john@example.com');
    expect(user.password).toBe('hashedPassword');
    expect(user.phone).toBe('+1234567890');
    expect(user.role).toBe('participant');
    expect(user.emailVerified).toBe(false);
    expect(user.active).toBe(true);
    expect(user.createdAt).toBe('2023-01-01T00:00:00.000Z');
    expect(user.updatedAt).toBe('2023-01-01T00:00:00.000Z');
  });

  it('should allow optional profileImageUrl', () => {
    const user = new User();
    user.id = 'user-id';
    user.name = 'John Doe';
    user.email = 'john@example.com';
    user.password = 'hashedPassword';
    user.phone = '+1234567890';
    user.role = 'participant';
    user.profileImageUrl = 'http://example.com/image.jpg';
    user.emailVerified = false;
    user.active = true;
    user.createdAt = '2023-01-01T00:00:00.000Z';
    user.updatedAt = '2023-01-01T00:00:00.000Z';

    expect(user.profileImageUrl).toBe('http://example.com/image.jpg');
  });

  it('should accept different role types', () => {
    const user = new User();
    
    user.role = 'admin';
    expect(user.role).toBe('admin');
    
    user.role = 'organizer';
    expect(user.role).toBe('organizer');
    
    user.role = 'participant';
    expect(user.role).toBe('participant');
  });
});