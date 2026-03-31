import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { circuitBreaker, ConsecutiveBreaker, CircuitBreakerPolicy, handleAll } from 'cockatiel';
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('redis-service');

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);
  private readonly policy: CircuitBreakerPolicy;

  constructor() {
    // Initialize circuit breaker
    this.policy = circuitBreaker(handleAll, {
      halfOpenAfter: 10_000,
      breaker: new ConsecutiveBreaker(5),
    });

    // Initialize Redis client in constructor — NOT onModuleInit.
    // ConfigModule validates REDIS_URL at startup (fail-fast),
    // so it is guaranteed available when CacheModule loads.
    this.client = new Redis(process.env.REDIS_URL!, {
      commandTimeout: 5000,
      connectTimeout: 5000,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err) => this.logger.error('Redis error', err.message));
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit();
    this.logger.log('Redis disconnected');
  }

  getClient(): Redis {
    return this.client;
  }

  async execute<T>(fn: (client: Redis) => Promise<T>): Promise<T> {
    return this.policy.execute(() => fn(this.client));
  }

  async get(key: string): Promise<string | null> {
    return tracer.startActiveSpan('redis.get', async (span) => {
      try {
        span.setAttribute('db.system', 'redis');
        span.setAttribute('db.operation', 'get');
        span.setAttribute('db.redis.key', key);
        return await this.execute((c) => c.get(key));
      } catch (error) {
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    return tracer.startActiveSpan('redis.set', async (span) => {
      try {
        span.setAttribute('db.system', 'redis');
        span.setAttribute('db.operation', 'set');
        span.setAttribute('db.redis.key', key);
        if (ttlSeconds !== undefined) {
          span.setAttribute('db.redis.ttl', ttlSeconds);
        }
        await this.execute(async (c) => {
          if (ttlSeconds) {
            await c.set(key, value, 'EX', ttlSeconds);
          } else {
            await c.set(key, value);
          }
        });
      } catch (error) {
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  async del(key: string): Promise<void> {
    return tracer.startActiveSpan('redis.del', async (span) => {
      try {
        span.setAttribute('db.system', 'redis');
        span.setAttribute('db.operation', 'del');
        span.setAttribute('db.redis.key', key);
        await this.execute((c) => c.del(key).then(() => undefined));
      } catch (error) {
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    return tracer.startActiveSpan('redis.expire', async (span) => {
      try {
        span.setAttribute('db.system', 'redis');
        span.setAttribute('db.operation', 'expire');
        span.setAttribute('db.redis.key', key);
        span.setAttribute('db.redis.ttl', ttlSeconds);
        await this.execute((c) => c.expire(key, ttlSeconds).then(() => undefined));
      } catch (error) {
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
