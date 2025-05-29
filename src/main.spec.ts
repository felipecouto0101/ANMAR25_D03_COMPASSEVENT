import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { CustomValidationPipe } from './infrastructure/pipes/validation.pipe';
import { AllExceptionsFilter } from './infrastructure/filters/exception.filter';

describe('Bootstrap', () => {
  it('should create a NestFactory instance', () => {
    expect(NestFactory).toBeDefined();
  });

  it('should have CustomValidationPipe available', () => {
    const pipe = new CustomValidationPipe();
    expect(pipe).toBeDefined();
    
  });

  it('should have AllExceptionsFilter available', () => {
    const filter = new AllExceptionsFilter();
    expect(filter).toBeDefined();
  });

  it('should have AppModule available', () => {
    expect(AppModule).toBeDefined();
  });
});