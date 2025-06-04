export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class EntityNotFoundException extends DomainException {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`);
  }
}

export class ValidationException extends DomainException {
  constructor(message: string, public readonly example?: any) {
    super(message);
    this.example = example;
  }
}

export class BusinessRuleException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

export class AuthorizationException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

export class ConflictException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}