import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppConfigModule } from './infrastructure/config/config.module';
import { DatabaseModule } from './infrastructure/database/prisma.module';
import { CacheModule } from './infrastructure/cache/redis.module';
import { HealthModule } from './infrastructure/health/health.module';
import { ExampleModule } from './modules/example/example.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { LoggerModule } from './shared/logger/logger.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    CacheModule,
    HealthModule,
    ExampleModule,
    LoggerModule,
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
      },
    ]),
  ],
  controllers: [],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
