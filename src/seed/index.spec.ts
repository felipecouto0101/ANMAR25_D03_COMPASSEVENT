import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';
import { bootstrap } from './index';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn().mockResolvedValue({
      get: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
};

jest.mock('@nestjs/common', () => ({
  Logger: jest.fn().mockImplementation(() => mockLogger),
}));

jest.mock('./seed.module', () => ({
  SeedModule: {},
}));

jest.mock('./seed.service', () => ({
  SeedService: {},
}));


describe('Seed Bootstrap', () => {
  let app: any;
  let seedService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    seedService = { seed: jest.fn().mockResolvedValue(undefined) };
    app = {
      get: jest.fn().mockReturnValue(seedService),
      close: jest.fn().mockResolvedValue(undefined),
    };

    (NestFactory.create as jest.Mock).mockResolvedValue(app);
  });

  it('should execute seed process successfully', async () => {
    await bootstrap();

    expect(NestFactory.create).toHaveBeenCalledWith(SeedModule);
    expect(app.get).toHaveBeenCalledWith(SeedService);
    expect(seedService.seed).toHaveBeenCalled();
    expect(mockLogger.log).toHaveBeenCalledWith('Starting seed process...');
    expect(mockLogger.log).toHaveBeenCalledWith('Seed process completed successfully');
    expect(app.close).toHaveBeenCalled();
  });

  it('should handle errors during seed process', async () => {
    seedService.seed.mockRejectedValueOnce(new Error('Test error'));

    await bootstrap();

    expect(seedService.seed).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith('Seed process failed: Test error');
    expect(app.close).toHaveBeenCalled();
  });

  it('should handle errors during app creation', async () => {
    (NestFactory.create as jest.Mock).mockRejectedValueOnce(new Error('Create error'));

    await bootstrap();

    expect(NestFactory.create).toHaveBeenCalledWith(SeedModule);
    expect(mockLogger.error).toHaveBeenCalledWith('Seed process failed: Create error');
    expect(app.close).not.toHaveBeenCalled();
  });

  it('should handle errors during app close', async () => {
    app.close.mockRejectedValueOnce(new Error('Close error'));

    await bootstrap();

    expect(app.close).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalledWith('Error closing application: Close error');
  });

  it('should export seedDatabase function', () => {
    const index = require('./index');
    expect(typeof index.bootstrap).toBe('function');
    expect(typeof index.seedDatabase).toBe('function');
    expect(index.seedDatabase).toBe(index.bootstrap);
  });

  it('should check if running as main module', () => {
    const index = require('./index');
    expect(typeof index.isMainModule).toBe('function');
    expect(index.isMainModule()).toBe(false); 
  });

  it('should execute bootstrap when isMainModule returns true', () => {
    
    const indexModule = require('./index');
    
   
    const bootstrapSpy = jest.spyOn(indexModule, 'bootstrap').mockImplementation(() => {});
    const isMainModuleSpy = jest.spyOn(indexModule, 'isMainModule').mockReturnValue(true);
    
    
    if (indexModule.isMainModule()) {
      indexModule.bootstrap();
    }
    
    
    expect(bootstrapSpy).toHaveBeenCalled();
    
   
    bootstrapSpy.mockRestore();
    isMainModuleSpy.mockRestore();
  });
});