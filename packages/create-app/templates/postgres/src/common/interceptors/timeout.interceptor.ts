import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { AppException } from '../../shared/exceptions/app.exception';

const DEFAULT_TIMEOUT_MS = 30000;

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const timeoutMs = process.env.REQUEST_TIMEOUT
      ? parseInt(process.env.REQUEST_TIMEOUT, 10)
      : DEFAULT_TIMEOUT_MS;

    return next.handle().pipe(
      timeout(timeoutMs),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              new AppException({
                code: 'REQUEST_TIMEOUT',
                message: 'Request timeout',
                statusCode: 408,
              }),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
