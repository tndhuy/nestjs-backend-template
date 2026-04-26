"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pinoConfig = void 0;
const path_1 = require("path");
{
    {
        #IF_OTEL;
    }
}
const api_1 = require("@opentelemetry/api");
{
    {
        /IF_OTEL;
    }
}
const isDev = process.env.NODE_ENV !== 'production';
const LOG_DIR = (0, path_1.join)(process.cwd(), 'logs');
const LOG_MAX_SIZE = '10M';
exports.pinoConfig = {
    pinoHttp: {
        level: isDev ? 'debug' : 'info',
        mixin() {
            {
                {
                    #IF_OTEL;
                }
            }
            const activeSpan = api_1.trace.getSpan(api_1.context.active());
            if (activeSpan) {
                const spanContext = activeSpan.spanContext();
                if ((0, api_1.isSpanContextValid)(spanContext)) {
                    return {
                        traceId: spanContext.traceId,
                        spanId: spanContext.spanId,
                        traceFlags: `0${spanContext.traceFlags.toString(16)}`,
                    };
                }
            }
            {
                {
                    /IF_OTEL;
                }
            }
            return {};
        },
        genReqId: (req) => req.headers['x-request-id'] || req.headers['x-correlation-id'],
        transport: {
            targets: [
                {
                    target: 'pino-roll',
                    options: {
                        file: (0, path_1.join)(LOG_DIR, 'application'),
                        frequency: 'daily',
                        size: LOG_MAX_SIZE,
                        mkdir: true,
                        extension: '.log',
                    },
                    level: 'info',
                },
                {
                    target: 'pino/file',
                    options: {
                        destination: (0, path_1.join)(LOG_DIR, 'error.log'),
                        mkdir: true,
                    },
                    level: 'error',
                },
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
            req: (req) => ({
                method: req.method,
                url: req.url,
            }),
            res: (res) => ({
                statusCode: res.statusCode,
            }),
        },
    },
};
//# sourceMappingURL=pino.config.js.map