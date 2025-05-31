import {
  DomainException,
  EntityNotFoundException,
  ValidationException,
  BusinessRuleException,
  AuthorizationException,
  ConflictException
} from './domain.exceptions';

describe('Domain Exceptions', () => {
  describe('DomainException', () => {
    it('should create a domain exception with correct message and name', () => {
      const exception = new DomainException('Test error message');
      expect(exception).toBeDefined();
      expect(exception.message).toBe('Test error message');
      expect(exception.name).toBe('DomainException');
      expect(exception instanceof Error).toBe(true);
    });
  });

  describe('EntityNotFoundException', () => {
    it('should create an entity not found exception with correct message', () => {
      const exception = new EntityNotFoundException('User', '123');
      expect(exception).toBeDefined();
      expect(exception.message).toBe('User with id 123 not found');
      expect(exception.name).toBe('EntityNotFoundException');
      expect(exception instanceof DomainException).toBe(true);
    });
  });

  describe('ValidationException', () => {
    it('should create a validation exception with correct message', () => {
      const exception = new ValidationException('Invalid input');
      expect(exception).toBeDefined();
      expect(exception.message).toBe('Invalid input');
      expect(exception.name).toBe('ValidationException');
      expect(exception instanceof DomainException).toBe(true);
    });

    it('should create a validation exception with example', () => {
      const example = { field: 'value' };
      const exception = new ValidationException('Invalid input', example);
      expect(exception).toBeDefined();
      expect(exception.message).toBe('Invalid input');
      expect(exception.example).toBe(example);
      expect(exception.name).toBe('ValidationException');
      expect(exception instanceof DomainException).toBe(true);
    });
  });

  describe('BusinessRuleException', () => {
    it('should create a business rule exception with correct message', () => {
      const exception = new BusinessRuleException('Business rule violated');
      expect(exception).toBeDefined();
      expect(exception.message).toBe('Business rule violated');
      expect(exception.name).toBe('BusinessRuleException');
      expect(exception instanceof DomainException).toBe(true);
    });
  });

  describe('AuthorizationException', () => {
    it('should create an authorization exception with correct message', () => {
      const exception = new AuthorizationException('Not authorized');
      expect(exception).toBeDefined();
      expect(exception.message).toBe('Not authorized');
      expect(exception.name).toBe('AuthorizationException');
      expect(exception instanceof DomainException).toBe(true);
    });
  });

  describe('ConflictException', () => {
    it('should create a conflict exception with correct message', () => {
      const exception = new ConflictException('Resource already exists');
      expect(exception).toBeDefined();
      expect(exception.message).toBe('Resource already exists');
      expect(exception.name).toBe('ConflictException');
      expect(exception instanceof DomainException).toBe(true);
    });
  });
});