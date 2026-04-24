import { join } from 'path';
import type { Params } from 'nestjs-pino';
import { trace, context, isSpanContextValid } from '@opentelemetry/api';

const isDev = process.env.NODE_ENV !== 'production';
const LOG_DIR = join(process.cwd(), 'logs');
const LOG_MAX_SIZE = '10M';

export const pinoConfig: Params = {
  pinoHttp: {
    level: isDev ? 'debug' : 'info',
    // Inject Trace context into every log line
    mixin() {
      const activeSpan = trace.getSpan(context.active());
      if (activeSpan) {
        const spanContext = activeSpan.spanContext();
        if (isSpanContextValid(spanContext)) {
          return {
            traceId: spanContext.traceId,
            spanId: spanContext.spanId,
            traceFlags: `0${spanContext.traceFlags.toString(16)}`,
          };
        }
      }
      return {};
    },
    // Standardize on X-Request-Id as the primary req.id
    genReqId: (req) => (req.headers['x-request-id'] as string) || (req.headers['x-correlation-id'] as string),
    transport: {
      targets: [
        // Daily rotating file for production-like environments
        {
          target: 'pino-roll',
          options: {
            file: join(LOG_DIR, 'application'),
            frequency: 'daily',
            size: LOG_MAX_SIZE,
            mkdir: true,
            extension: '.log',
          },
          level: 'info',
        },
        // Dedicated error log
        {
          target: 'pino/file',
          options: {
            destination: join(LOG_DIR, 'error.log'),
            mkdir: true,
          },
          level: 'error',
        },
        // Console output (pretty in Dev, JSON in Prod)
        ...(isDev
          ? [
              {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                  ignore: 'pid,hostname',
                  messageKey: 'message',
                },
                level: 'debug',
              },
            ]
          : [
              {
                target: 'pino/file',
                options: { destination: 1 },
                level: 'info',
              },
            ]),
      ],
    },
    messageKey: 'message',
    serializers: {
      req: (req: { method: string; url: string }) => ({
        method: req.method,
        url: req.url,
      }),
      res: (res: { statusCode: number }) => ({
        statusCode: res.statusCode,
      }),
    },
  },
};
