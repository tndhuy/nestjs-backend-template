import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class LoggerService {
  private context: string = LoggerService.name;

  constructor(
    @InjectPinoLogger(LoggerService.name)
    private readonly logger: PinoLogger,
  ) {}

  log(message: string, contextOrMetadata?: string | Record<string, unknown>): void {
    const metadata = this.normalizeMetadata(contextOrMetadata);
    this.logger.info(metadata, message);
  }

  error(message: string, traceOrMetadata?: string | Record<string, unknown>, context?: string): void {
    let metadata: Record<string, unknown>;
    if (typeof traceOrMetadata === 'string') {
      metadata = { trace: traceOrMetadata, context: context || this.context };
    } else {
      metadata = this.normalizeMetadata(traceOrMetadata);
    }
    this.logger.error(metadata, message);
  }

  warn(message: string, contextOrMetadata?: string | Record<string, unknown>): void {
    const metadata = this.normalizeMetadata(contextOrMetadata);
    this.logger.warn(metadata, message);
  }

  debug(message: string, contextOrMetadata?: string | Record<string, unknown>): void {
    const metadata = this.normalizeMetadata(contextOrMetadata);
    this.logger.debug(metadata, message);
  }

  setContext(context: string): this {
    this.context = context;
    return this;
  }

  private normalizeMetadata(contextOrMetadata?: string | Record<string, unknown>): Record<string, unknown> {
    if (!contextOrMetadata) return { context: this.context };
    if (typeof contextOrMetadata === 'string') return { context: contextOrMetadata };
    return { context: this.context, ...contextOrMetadata };
  }
}
