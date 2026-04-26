"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const nestjs_pino_1 = require("nestjs-pino");
const config_module_1 = require("./infrastructure/config/config.module");
const prisma_module_1 = require("./infrastructure/database/prisma.module");
const redis_module_1 = require("./infrastructure/cache/redis.module");
const health_module_1 = require("./infrastructure/health/health.module");
const example_module_1 = require("./modules/example/example.module");
const correlation_id_middleware_1 = require("./common/middleware/correlation-id.middleware");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(correlation_id_middleware_1.CorrelationIdMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_module_1.AppConfigModule,
            prisma_module_1.DatabaseModule,
            redis_module_1.CacheModule,
            health_module_1.HealthModule,
            example_module_1.ExampleModule,
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
                    genReqId: (req) => req.headers['x-correlation-id'],
                    transport: process.env.NODE_ENV !== 'production'
                        ? {
                            target: 'pino-pretty',
                            options: {
                                colorize: true,
                                translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
                                ignore: 'pid,hostname',
                            },
                        }
                        : undefined,
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
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10) * 1000,
                    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
                },
            ]),
        ],
        controllers: [],
        providers: [{ provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard }],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map