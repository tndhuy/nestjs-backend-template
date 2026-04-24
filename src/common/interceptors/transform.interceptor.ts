import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PUBLIC_API_KEY } from '../decorators/public-api.decorator';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, unknown> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_API_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Internal first: If not explicitly marked as Public API, return RAW data
    if (!isPublic) {
      return next.handle();
    }

    // Public API: Wrap response in a standardized success object
    return next.handle().pipe(map((data) => ({ success: true, data })));
  }
}
