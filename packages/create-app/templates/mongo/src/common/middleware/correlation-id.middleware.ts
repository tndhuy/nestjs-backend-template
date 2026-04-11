import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { AsyncLocalStorage } from 'async_hooks';

export const REQUEST_ID_HEADER = 'X-Request-Id';
export const requestIdStorage = new AsyncLocalStorage<string>();

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId =
      (req.headers[REQUEST_ID_HEADER.toLowerCase()] as string) || 
      (req.headers['x-correlation-id'] as string) || 
      randomUUID();

    // Ensure it's in headers for downstream and logs
    req.headers[REQUEST_ID_HEADER.toLowerCase()] = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);

    // Wrap in AsyncLocalStorage so it's accessible everywhere
    requestIdStorage.run(requestId, () => {
      next();
    });
  }
}
