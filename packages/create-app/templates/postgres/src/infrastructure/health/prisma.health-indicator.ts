import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
{{#IF_POSTGRES}}
      await this.prisma.$queryRaw`SELECT 1`;
{{/IF_POSTGRES}}
{{#IF_MONGO}}
      // Prisma on MongoDB uses $runCommandRaw for ping or simple check
      await this.prisma.$runCommandRaw({ ping: 1 });
{{/IF_MONGO}}
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError('Database check failed', this.getStatus(key, false));
    }
  }
}
