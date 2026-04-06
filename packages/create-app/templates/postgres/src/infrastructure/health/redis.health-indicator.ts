import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redis: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const result = await this.redis.getClient().ping();
      const isUp = result === 'PONG';
      return this.getStatus(key, isUp);
    } catch (error) {
      throw new HealthCheckError('Redis check failed', this.getStatus(key, false));
    }
  }
}
