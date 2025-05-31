import { bootstrap, isMainModule } from './main';


jest.mock('@nestjs/core', () => {
  const mockApp = {
    useGlobalPipes: jest.fn(),
    useGlobalFilters: jest.fn(),
    enableCors: jest.fn(),
    listen: jest.fn().mockResolvedValue(undefined),
  };
  
  return {
    NestFactory: {
      create: jest.fn().mockResolvedValue(mockApp),
    },
  };
});


jest.mock('./app.module', () => ({
  AppModule: class {}
}));


jest.mock('@nestjs/swagger', () => {
  return {
    DocumentBuilder: jest.fn().mockImplementation(() => ({
      setTitle: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      setVersion: jest.fn().mockReturnThis(),
      addBearerAuth: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({}),
    })),
    SwaggerModule: {
      createDocument: jest.fn().mockReturnValue({}),
      setup: jest.fn(),
    },
  };
});

describe('Main', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should bootstrap the application with default port', async () => {
    const app = await bootstrap();
    expect(app).toBeDefined();
  });
  
  it('should bootstrap the application with custom port', async () => {
    const app = await bootstrap({ port: 4000 });
    expect(app).toBeDefined();
  });
  
  it('should check if it is the main module', () => {
    const result = isMainModule();
    expect(typeof result).toBe('boolean');
  });
});