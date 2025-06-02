
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn()
}));

jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn(),
  SendEmailCommand: jest.fn(),
  ListVerifiedEmailAddressesCommand: jest.fn()
}));


jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true)
}));


jest.mock('ical-generator', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      createEvent: jest.fn().mockReturnThis(),
      toString: jest.fn().mockReturnValue('test-ical')
    }))
  };
});


global.crypto = {
  getRandomValues: arr => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
  subtle: {
    digest: () => Promise.resolve(new ArrayBuffer(32))
  },
  randomUUID: () => 'test-uuid'
};


jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid')
}));