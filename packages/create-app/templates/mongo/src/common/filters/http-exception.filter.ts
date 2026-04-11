import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../../shared/logger/logger.service';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode = exception.getStatus();
    const res = exception.getResponse() as any;
    
    const code = res.error || HttpStatus[statusCode] || 'INTERNAL_ERROR';
    const message = res.message || exception.message;

    this.logger.error(
      `[${request.method}] ${request.url} - ${statusCode} ${code}: ${message}`,
      exception.stack,
    );

    // Standardized Error Response
    response.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
        statusCode,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
