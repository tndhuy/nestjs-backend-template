import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { RedisService } from '../cache/redis.service';
export declare class RedisHealthIndicator extends HealthIndicator {
    private readonly redis;
    constructor(redis: RedisService);
    isHealthy(key: string): Promise<HealthIndicatorResult>;
}
