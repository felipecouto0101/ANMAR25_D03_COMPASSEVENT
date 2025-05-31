import { AllExceptionsFilter } from './exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { 
  EntityNotFoundException, 
  ValidationException,
  BusinessRuleException,
  AuthorizationException,
  ConflictException
} from '../../domain/exceptions/domain.exceptions';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: any;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    
    mockRequest = {
      url: '/test-url',
    };
    
    mockHost = {
      switchToHttp: jest.fn().mockReturnThis(),
      getResponse: jest.fn().mockReturnValue(mockResponse),
      getRequest: jest.fn().mockReturnValue(mockRequest),
    };

   
    const mockDate = new Date('2023-01-01T00:00:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.Date = Date;
  });

  it('should handle HttpException', () => {
    const exception = new HttpException('Test message', HttpStatus.BAD_REQUEST);
    
    filter.catch(exception, mockHost);
    
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: '2023-01-01T00:00:00.000Z',
      path: '/test-url',
      message: 'Test message',
    });
  });

  it('should handle EntityNotFoundException', () => {
    const exception = new EntityNotFoundException('User', '123');
    
    filter.catch(exception, mockHost);
    
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      timestamp: '2023-01-01T00:00:00.000Z',
      path: '/test-url',
      message: 'User with id 123 not found',
    });
  });

  it('should handle ValidationException with example', () => {
    const exception = new ValidationException('Invalid input', { field: 'example value' });
    
    filter.catch(exception, mockHost);
    
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: '2023-01-01T00:00:00.000Z',
      path: '/test-url',
      message: 'Invalid input',
      example: { field: 'example value' },
    });
  });

  it('should handle BusinessRuleException', () => {
    const exception = new BusinessRuleException('Business rule violated');
    
    filter.catch(exception, mockHost);
    
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: '2023-01-01T00:00:00.000Z',
      path: '/test-url',
      message: 'Business rule violated',
    });
  });

  it('should handle AuthorizationException', () => {
    const exception = new AuthorizationException('Not authorized');
    
    filter.catch(exception, mockHost);
    
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.FORBIDDEN,
      timestamp: '2023-01-01T00:00:00.000Z',
      path: '/test-url',
      message: 'Not authorized',
    });
  });

  it('should handle ConflictException', () => {
    const exception = new ConflictException('Resource already exists');
    
    filter.catch(exception, mockHost);
    
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      timestamp: '2023-01-01T00:00:00.000Z',
      path: '/test-url',
      message: 'Resource already exists',
    });
  });

  it('should handle generic Error', () => {
    const exception = new Error('Unknown error');
    
    filter.catch(exception, mockHost);
    
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: '2023-01-01T00:00:00.000Z',
      path: '/test-url',
      message: 'Unknown error',
    });
  });

  it('should handle unknown exceptions', () => {
    const exception = 'Not an error object';
    
    filter.catch(exception, mockHost);
    
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: '2023-01-01T00:00:00.000Z',
      path: '/test-url',
      message: 'Internal server error',
    });
  });
});