import { AppModule } from './app.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppModule', () => {
  it('should define the AppModule', () => {
    expect(AppModule).toBeDefined();
  });

  it('should have controllers defined', () => {
    const metadata = Reflect.getMetadata('controllers', AppModule);
    expect(metadata).toBeDefined();
    expect(metadata).toContain(AppController);
  });

  it('should have providers defined', () => {
    const metadata = Reflect.getMetadata('providers', AppModule);
    expect(metadata).toBeDefined();
    expect(metadata.some(provider => 
      provider === AppService || 
      (typeof provider === 'object' && provider.provide === AppService)
    )).toBeTruthy();
  });
});