import { Test } from '@nestjs/testing';
import { NestFactory } from '@nestjs/core';
import { seedDatabase } from './index';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';
import { Logger } from '@nestjs/common';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

describe('Seed Index', () => {
  let mockApp: any;
  let mockSeedService: any;

  beforeEach(() => {
    mockSeedService = {
      seed: jest.fn().mockResolvedValue(undefined),
    };

    mockApp = {
      get: jest.fn().mockReturnValue(mockSeedService),
      close: jest.fn().mockResolvedValue(undefined),
    };

    (NestFactory.create as jest.Mock).mockResolvedValue(mockApp);

    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create NestFactory with SeedModule', async () => {
    await seedDatabase();
    expect(NestFactory.create).toHaveBeenCalledWith(SeedModule);
  });

  it('should get SeedService from app', async () => {
    await seedDatabase();
    expect(mockApp.get).toHaveBeenCalledWith(SeedService);
  });

  it('should call seed method on SeedService', async () => {
    await seedDatabase();
    expect(mockSeedService.seed).toHaveBeenCalled();
  });

  it('should log success message when seed completes', async () => {
    await seedDatabase();
    expect(Logger.prototype.log).toHaveBeenCalledWith('Seed process completed successfully');
  });

  it('should close app when seed completes', async () => {
    await seedDatabase();
    expect(mockApp.close).toHaveBeenCalled();
  });

  it('should handle errors and log them', async () => {
    const error = new Error('Seed error');
    mockSeedService.seed.mockRejectedValue(error);

    await seedDatabase();

    expect(Logger.prototype.error).toHaveBeenCalledWith(`Seed process failed: ${error.message}`);
    expect(mockApp.close).toHaveBeenCalled();
  });
});