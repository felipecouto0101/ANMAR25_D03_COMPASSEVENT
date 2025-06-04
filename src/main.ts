import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AllExceptionsFilter } from './infrastructure/filters/exception.filter';
import { CustomValidationPipe } from './infrastructure/pipes/validation.pipe';

export interface BootstrapOptions {
  port?: string | number;
}

export async function bootstrap(options: BootstrapOptions = {}) {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new CustomValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  
  app.enableCors();
  
  const config = new DocumentBuilder()
    .setTitle('ANMAR25_D03_COMPASSEVENT')
    .setDescription('The API description')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  const port = options.port !== undefined ? options.port : (process.env.PORT ?? 3000);
  await app.listen(port);
  
  return app;
}

export function isMainModule() {
  return require.main === module;
}

if (isMainModule()) {
  bootstrap();
}