import { ConfigModule } from '@nestjs/config';

describe('ConfigModule', () => {
  it('should be defined', () => {
    expect(ConfigModule).toBeDefined();
  });

  it('should have forRoot method', () => {
    expect(typeof ConfigModule.forRoot).toBe('function');
  });

  it('should create a dynamic module', () => {
    const module = ConfigModule.forRoot();
    expect(module).toBeDefined();
  });

  it('should accept options', () => {
    const module = ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env.test'
    });
    expect(module).toBeDefined();
  });
});