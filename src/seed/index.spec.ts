import { bootstrap, isMainModule } from './index';
import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';


const mockSeedService = {
  seed: jest.fn().mockResolvedValue(undefined),
};


const mockApp = {
  get: jest.fn(),
  close: jest.fn(),
};


mockApp.get.mockReturnValue(mockSeedService);
mockApp.close.mockResolvedValue(undefined);


jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

describe('Seed Index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
  });
  
  it('should bootstrap the seed process', async () => {
    await bootstrap();
    
    expect(NestFactory.create).toHaveBeenCalledWith(SeedModule);
    expect(mockApp.get).toHaveBeenCalledWith(SeedService);
    expect(mockSeedService.seed).toHaveBeenCalled();
    expect(mockApp.close).toHaveBeenCalled();
  });
  
  it('should handle errors during seed process', async () => {
    mockSeedService.seed.mockRejectedValueOnce(new Error('Test error'));
    
    await bootstrap();
    
    expect(mockApp.close).toHaveBeenCalled();
  });
  
  it('should handle errors during app close', async () => {
    mockApp.close.mockRejectedValueOnce(new Error('Close error'));
    
    await bootstrap();
    
    expect(mockSeedService.seed).toHaveBeenCalled();
  });
  
  it('should check if it is the main module', () => {
    const result = isMainModule();
    expect(typeof result).toBe('boolean');
  });
});