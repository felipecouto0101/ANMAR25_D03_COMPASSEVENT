import { Roles, ROLES_KEY } from './roles.decorator';

describe('Roles Decorator', () => {
  it('should have the correct roles key constant', () => {
    expect(ROLES_KEY).toBe('roles');
  });

});