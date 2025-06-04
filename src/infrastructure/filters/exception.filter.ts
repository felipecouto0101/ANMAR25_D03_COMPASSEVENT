import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { 
  EntityNotFoundException, 
  ValidationException,
  BusinessRuleException,
  AuthorizationException,
  ConflictException as DomainConflictException
} from '../../domain/exceptions/domain.exceptions';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorDetails = this.getErrorDetails(exception);

    const responseBody: any = {
      statusCode: errorDetails.status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: errorDetails.message
    };

    if (errorDetails.example !== undefined) {
      responseBody.example = errorDetails.example;
    }

    response.status(errorDetails.status).json(responseBody);
  }

  private getErrorDetails(exception: unknown): { status: number; message: string; example?: any } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const errorResponse = exception.getResponse() as any;
      return {
        status,
        message: errorResponse.message || exception.message
      };
    }

    if (exception instanceof EntityNotFoundException) {
      return {
        status: HttpStatus.NOT_FOUND,
        message: exception.message
      };
    }

    if (exception instanceof ValidationException) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: exception.message,
        example: exception.example
      };
    }

    if (exception instanceof BusinessRuleException) {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: exception.message
      };
    }

    if (exception instanceof AuthorizationException) {
      return {
        status: HttpStatus.FORBIDDEN,
        message: exception.message
      };
    }

    if (exception instanceof DomainConflictException) {
      return {
        status: HttpStatus.CONFLICT,
        message: exception.message
      };
    }

    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error'
    };
  }
}