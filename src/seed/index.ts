import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

async function bootstrap() {
  const logger = new Logger('Seed');
  logger.log('Starting seed process...');

  const app = await NestFactory.create(SeedModule);
  const seedService = app.get(SeedService);
  
  try {
    await seedService.seed();
    logger.log('Seed process completed successfully');
  } catch (error) {
    logger.error(`Seed process failed: ${error.message}`);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  bootstrap();
}

export { bootstrap as seedDatabase };