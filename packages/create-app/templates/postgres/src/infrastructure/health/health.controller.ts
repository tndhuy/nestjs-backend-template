import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaHealthIndicator } from './prisma.health-indicator';
import { RedisHealthIndicator } from './redis.health-indicator';
import { RawResponse } from '../../common';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: PrismaHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @RawResponse()
  @ApiOperation({ summary: 'Overall health check' })
  check() {
    return this.health.check([
      () => this.db.isHealthy('database'),
      () => this.redis.isHealthy('redis'),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  @RawResponse()
  @ApiOperation({ summary: 'Readiness probe' })
  ready() {
    return this.health.check([
      () => this.db.isHealthy('database'),
      () => this.redis.isHealthy('redis'),
    ]);
  }

  @Get('live')
  @HealthCheck()
  @RawResponse()
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    return this.health.check([]);
  }
}
