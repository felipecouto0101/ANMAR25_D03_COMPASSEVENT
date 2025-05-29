import { ConfigService } from '@nestjs/config';

describe('ConfigService', () => {
  let configService: ConfigService;
  
  beforeEach(() => {
    const mockEnv = {
      NODE_ENV: 'test',
      PORT: '3000',
      AWS_REGION: 'us-east-1'
    };
    
    configService = new ConfigService(mockEnv);
  });

  it('should be defined', () => {
    expect(configService).toBeDefined();
  });

  it('should return environment variables', () => {
    expect(configService.get('NODE_ENV')).toBe('test');
    expect(configService.get('PORT')).toBe('3000');
    expect(configService.get('AWS_REGION')).toBe('us-east-1');
  });

  it('should return undefined for non-existent variables', () => {
    expect(configService.get('NON_EXISTENT')).toBeUndefined();
  });

  it('should return default value for non-existent variables', () => {
    expect(configService.get('NON_EXISTENT', 'default')).toBe('default');
  });
});