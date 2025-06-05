
const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjE2MTYyMjIyLCJleHAiOjk5OTk5OTk5OTl9.mock-signature';

export const JwtModule = {
  register: () => ({
    module: class JwtModule {},
    providers: [
      {
        provide: 'JwtService',
        useValue: {
          sign: jest.fn().mockReturnValue(mockJwtToken),
          verify: jest.fn().mockReturnValue({
            sub: 'test-user-id',
            email: 'admin@example.com',
            role: 'admin'
          })
        }
      }
    ],
    exports: ['JwtService']
  }),
  registerAsync: () => ({
    module: class JwtModule {},
    providers: [
      {
        provide: 'JwtService',
        useValue: {
          sign: jest.fn().mockReturnValue(mockJwtToken),
          verify: jest.fn().mockReturnValue({
            sub: 'test-user-id',
            email: 'admin@example.com',
            role: 'admin'
          })
        }
      }
    ],
    exports: ['JwtService']
  })
};

export const JwtService = jest.fn().mockImplementation(() => ({
  sign: jest.fn().mockReturnValue(mockJwtToken),
  verify: jest.fn().mockReturnValue({
    sub: 'test-user-id',
    email: 'admin@example.com',
    role: 'admin'
  })
}));


export const PassportModule = {
  register: () => ({
    module: class PassportModule {},
    providers: [],
    exports: []
  })
};