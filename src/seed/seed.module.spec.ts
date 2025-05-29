import { Test } from '@nestjs/testing';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';
import { ConfigModule } from '@nestjs/config';

jest.mock('../modules/users/users.module', () => ({
  UsersModule: class MockUsersModule {}
}));

describe('SeedModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [SeedModule],
    })
      .overrideProvider(SeedService)
      .useValue({ seed: jest.fn() })
      .compile();

    expect(module).toBeDefined();
  });

  it('should provide SeedService', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        SeedModule,
      ],
    })
      .overrideProvider(SeedService)
      .useValue({ seed: jest.fn() })
      .compile();

    const service = module.get<SeedService>(SeedService);
    expect(service).toBeDefined();
    expect(service.seed).toBeDefined();
  });
});