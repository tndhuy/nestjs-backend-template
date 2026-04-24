import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppException } from '../../shared/exceptions/app.exception';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let code: string;
    let message: string;
    let statusCode: number;
    let details: unknown = null;

    if (exception instanceof AppException) {
      code = exception.code;
      message = exception.message;
      statusCode = exception.getStatus();
      details = exception.details ?? null;
    } else {
      statusCode = exception.getStatus();
      code = HttpStatus[statusCode] ?? 'UNKNOWN_ERROR';
      message = exception.message;
    }

    this.logger.error(
      `[${request.method}] ${request.url} - ${statusCode} ${code}: ${message}`,
    );

    response.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        statusCode,
        details,
      },
    });
  }
}
