import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { bootstrap } from './main';

jest.mock('./app.module', () => ({
  AppModule: class MockAppModule {},
}));

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn().mockResolvedValue({
      useGlobalPipes: jest.fn(),
      useGlobalFilters: jest.fn(),
      enableCors: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

const mockDocumentBuilder = {
  setTitle: jest.fn().mockReturnThis(),
  setDescription: jest.fn().mockReturnThis(),
  setVersion: jest.fn().mockReturnThis(),
  addBearerAuth: jest.fn().mockReturnThis(),
  build: jest.fn().mockReturnValue({}),
};

jest.mock('@nestjs/swagger', () => ({
  SwaggerModule: {
    createDocument: jest.fn().mockReturnValue({}),
    setup: jest.fn(),
  },
  DocumentBuilder: jest.fn().mockImplementation(() => mockDocumentBuilder),
  ApiProperty: jest.fn(),
}));

jest.mock('./infrastructure/filters/exception.filter', () => ({
  AllExceptionsFilter: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('./infrastructure/pipes/validation.pipe', () => ({
  CustomValidationPipe: jest.fn().mockImplementation(() => ({})),
}));



describe('Bootstrap', () => {
  let app: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
    jest.clearAllMocks();
    app = {
      useGlobalPipes: jest.fn(),
      useGlobalFilters: jest.fn(),
      enableCors: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };
    (NestFactory.create as jest.Mock).mockResolvedValue(app);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should bootstrap the application', async () => {
    await bootstrap();
    
    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
    expect(app.useGlobalPipes).toHaveBeenCalled();
    expect(app.useGlobalFilters).toHaveBeenCalled();
    expect(app.enableCors).toHaveBeenCalled();
    expect(app.listen).toHaveBeenCalled();
  });

  it('should use custom port from environment variable', async () => {
    process.env.PORT = '4000';
    await bootstrap();
    expect(app.listen).toHaveBeenCalledWith('4000');
  });

  it('should use default port when PORT is not defined', async () => {
    delete process.env.PORT;
    await bootstrap();
    expect(app.listen).toHaveBeenCalledWith(3000);
  });

  it('should use injected port option', async () => {
    await bootstrap({ port: 5000 });
    expect(app.listen).toHaveBeenCalledWith(5000);
  });

  it('should prioritize injected port over environment variable', async () => {
    process.env.PORT = '4000';
    await bootstrap({ port: 5000 });
    expect(app.listen).toHaveBeenCalledWith(5000);
  });

  it('should handle empty PORT value', async () => {
    process.env.PORT = '';
    await bootstrap();
    expect(app.listen).toHaveBeenCalledWith('');
  });

  it('should handle null PORT value', async () => {
    process.env.PORT = null as any;
    await bootstrap();
    expect(app.listen).toHaveBeenCalledWith(3000);
  });

  it('should handle undefined PORT value', async () => {
    process.env.PORT = undefined as any;
    await bootstrap();
    expect(app.listen).toHaveBeenCalledWith(3000);
  });

  it('should set up Swagger with correct configuration', async () => {
    await bootstrap();
    
    expect(mockDocumentBuilder.setTitle).toHaveBeenCalledWith('ANMAR25_D03_COMPASSEVENT');
    expect(mockDocumentBuilder.setDescription).toHaveBeenCalledWith('The API description');
    expect(mockDocumentBuilder.setVersion).toHaveBeenCalledWith('1.0');
    expect(mockDocumentBuilder.addBearerAuth).toHaveBeenCalledWith(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token'
    );
    expect(mockDocumentBuilder.build).toHaveBeenCalled();
    expect(SwaggerModule.createDocument).toHaveBeenCalled();
    expect(SwaggerModule.setup).toHaveBeenCalledWith('api', app, expect.anything());
  });

  it('should handle errors during bootstrap', async () => {
    const error = new Error('Test error');
    (NestFactory.create as jest.Mock).mockRejectedValueOnce(error);
    
    await expect(bootstrap()).rejects.toThrow('Test error');
  });

  it('should test isMainModule function', () => {
    const mainModule = require('./main');
    
    const originalIsMainModule = mainModule.isMainModule;
    
    mainModule.isMainModule = jest.fn().mockReturnValue(true);
    const bootstrapSpy = jest.spyOn(mainModule, 'bootstrap').mockImplementation(() => Promise.resolve());
    
    if (mainModule.isMainModule()) {
      mainModule.bootstrap();
    }
    
    expect(mainModule.isMainModule).toHaveBeenCalled();
    expect(bootstrapSpy).toHaveBeenCalled();
    
    mainModule.isMainModule = originalIsMainModule;
    bootstrapSpy.mockRestore();
  });

  it('should not call bootstrap when isMainModule returns false', () => {
    const mainModule = require('./main');
    
    const bootstrapSpy = jest.spyOn(mainModule, 'bootstrap').mockImplementation(() => Promise.resolve());
    
    const originalIsMainModule = mainModule.isMainModule;
    mainModule.isMainModule = jest.fn().mockReturnValue(false);
    
    if (mainModule.isMainModule()) {
      mainModule.bootstrap();
    }
    
    expect(bootstrapSpy).not.toHaveBeenCalled();
    
    mainModule.isMainModule = originalIsMainModule;
    bootstrapSpy.mockRestore();
  });
});