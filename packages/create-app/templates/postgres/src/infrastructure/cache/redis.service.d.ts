import { OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
export declare class RedisService implements OnModuleDestroy {
    private readonly client;
    private readonly logger;
    private readonly policy;
    constructor();
    onModuleDestroy(): Promise<void>;
    getClient(): Redis;
    execute<T>(fn: (client: Redis) => Promise<T>): Promise<T>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    expire(key: string, ttlSeconds: number): Promise<void>;
}
