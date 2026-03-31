import { HttpException } from '@nestjs/common';
import { AppException } from '../../shared/exceptions/app.exception';
import { ErrorCodes } from '../../shared/exceptions/error-codes';
import { HttpExceptionFilter } from './http-exception.filter';

function createMockHost(jsonMock: jest.Mock) {
  const statusMock = jest.fn().mockReturnValue({ json: jsonMock });
  const response = { status: statusMock };
  const request = { method: 'GET', url: '/test' };
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as any;
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    jsonMock = jest.fn();
  });

  it('should format AppException(NOT_FOUND) to correct error shape', () => {
    const exception = new AppException({
      code: ErrorCodes.NOT_FOUND,
      message: 'Item not found',
      statusCode: 404,
    });
    const host = createMockHost(jsonMock);

    filter.catch(exception, host);

    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Item not found',
        statusCode: 404,
        details: null,
      },
    });
  });

  it('should include details array from AppException', () => {
    const details = [{ field: 'email', constraints: { isEmail: 'must be email' } }];
    const exception = new AppException({
      code: ErrorCodes.VALIDATION_FAILED,
      message: 'Validation failed',
      statusCode: 400,
      details,
    });
    const host = createMockHost(jsonMock);

    filter.catch(exception, host);

    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        statusCode: 400,
        details,
      },
    });
  });

  it('should handle generic HttpException(403) with FORBIDDEN code', () => {
    const exception = new HttpException('Forbidden', 403);
    const host = createMockHost(jsonMock);

    filter.catch(exception, host);

    const call = jsonMock.mock.calls[0][0];
    expect(call.success).toBe(false);
    expect(call.error.statusCode).toBe(403);
    expect(call.error.code).toBe('FORBIDDEN');
    expect(call.error.details).toBeNull();
  });

  it('should handle generic HttpException(500) with INTERNAL_SERVER_ERROR code', () => {
    const exception = new HttpException('Internal Server Error', 500);
    const host = createMockHost(jsonMock);

    filter.catch(exception, host);

    const call = jsonMock.mock.calls[0][0];
    expect(call.success).toBe(false);
    expect(call.error.statusCode).toBe(500);
    expect(call.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});
