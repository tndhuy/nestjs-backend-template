import { HttpException } from '@nestjs/common';
import { AppException } from './app.exception';
import { ErrorCodes } from './error-codes';

describe('AppException', () => {
  it('should set code, message, statusCode from payload', () => {
    const exception = new AppException({
      code: ErrorCodes.NOT_FOUND,
      message: 'Item not found',
      statusCode: 404,
    });

    expect(exception.code).toBe('NOT_FOUND');
    expect(exception.message).toBe('Item not found');
    expect(exception.getStatus()).toBe(404);
  });

  it('should set details from payload', () => {
    const details = [{ field: 'email', constraints: { isEmail: 'must be email' } }];
    const exception = new AppException({
      code: ErrorCodes.VALIDATION_FAILED,
      message: 'Validation failed',
      statusCode: 400,
      details,
    });

    expect(exception.details).toEqual(details);
  });

  it('should default details to undefined when not provided', () => {
    const exception = new AppException({
      code: ErrorCodes.INTERNAL_ERROR,
      message: 'Something went wrong',
      statusCode: 500,
    });

    expect(exception.details).toBeUndefined();
  });

  it('should be instanceof HttpException', () => {
    const exception = new AppException({
      code: ErrorCodes.UNAUTHORIZED,
      message: 'Unauthorized',
      statusCode: 401,
    });

    expect(exception).toBeInstanceOf(HttpException);
  });

  it('should return the correct statusCode via getStatus()', () => {
    const exception = new AppException({
      code: ErrorCodes.FORBIDDEN,
      message: 'Forbidden',
      statusCode: 403,
    });

    expect(exception.getStatus()).toBe(403);
  });
});
