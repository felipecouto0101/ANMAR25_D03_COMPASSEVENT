import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

export async function bootstrap() {
  const logger = new Logger('Seed');
  logger.log('Starting seed process...');

  let app;
  try {
    app = await NestFactory.create(SeedModule);
    const seedService = app.get(SeedService);
    await seedService.seed();
    logger.log('Seed process completed successfully');
  } catch (error) {
    logger.error(`Seed process failed: ${error.message}`);
  } finally {
    if (app) {
      try {
        await app.close();
      } catch (error) {
        logger.error(`Error closing application: ${error.message}`);
      }
    }
  }
}

export const seedDatabase = bootstrap;

export function isMainModule() {
  return require.main === module;
}

// Executar quando chamado diretamente
if (isMainModule()) {
  bootstrap();
}