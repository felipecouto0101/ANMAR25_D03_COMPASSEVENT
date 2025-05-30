import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { MailModule } from './infrastructure/mail/mail.module';
import { EventsModule } from './modules/events/events.module';
import { UsersModule } from './modules/users/users.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { SeedModule } from './seed/seed.module';
import { AuthModule } from './modules/auth/auth.module';
import { SeedService } from './seed/seed.service';

jest.mock('./seed/seed.service', () => ({
  SeedService: jest.fn().mockImplementation(() => ({
    seed: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('AppModule', () => {
  it('should be defined', () => {
    expect(AppModule).toBeDefined();
  });

  it('should have correct imports', () => {
    const imports = Reflect.getMetadata('imports', AppModule);
    expect(imports).toContain(ConfigModule);
    expect(imports).toContain(DatabaseModule);
    expect(imports).toContain(MailModule);
    expect(imports).toContain(AuthModule);
    expect(imports).toContain(EventsModule);
    expect(imports).toContain(UsersModule);
    expect(imports).toContain(RegistrationsModule);
    expect(imports).toContain(SeedModule);
  });

  it('should have correct providers', () => {
    const providers = Reflect.getMetadata('providers', AppModule);
    expect(providers.length).toBeGreaterThan(0);
  });

  it('should call seed method on module init', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = module.createNestApplication();
    await app.init();

    const seedService = module.get<SeedService>(SeedService);
    expect(seedService.seed).toHaveBeenCalled();
    
    await app.close();
  });
});