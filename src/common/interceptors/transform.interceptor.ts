import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { STANDARD_RESPONSE_KEY } from '../decorators/standard-response.decorator';

export const RAW_RESPONSE_KEY = 'raw_response';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, unknown> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isRaw = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isRaw) {
      return next.handle();
    }

    const useStandard = this.reflector.getAllAndOverride<boolean>(STANDARD_RESPONSE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Internal first: If not explicitly marked for Standard Response, return RAW data
    if (!useStandard) {
      return next.handle();
    }

    // Standard Response: Wrap response in a standardized success object
    return next.handle().pipe(
      map((data) => {
        // Handle paginated results: { items: [], meta: {} }
        if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
          return {
            success: true,
            data: data.items,
            meta: data.meta,
          };
        }

        return { success: true, data };
      }),
    );
  }
}
