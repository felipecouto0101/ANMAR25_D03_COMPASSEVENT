import { Public, IS_PUBLIC_KEY } from './public.decorator';

describe('Public Decorator', () => {
  it('should have the correct public key constant', () => {
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });

});