import { PinoLogger } from 'nestjs-pino';
export declare class LoggerService {
    private readonly logger;
    private context;
    constructor(logger: PinoLogger);
    log(message: string, contextOrMetadata?: string | Record<string, unknown>): void;
    error(message: string, traceOrMetadata?: string | Record<string, unknown>, context?: string): void;
    warn(message: string, contextOrMetadata?: string | Record<string, unknown>): void;
    debug(message: string, contextOrMetadata?: string | Record<string, unknown>): void;
    setContext(context: string): this;
    private normalizeMetadata;
}
