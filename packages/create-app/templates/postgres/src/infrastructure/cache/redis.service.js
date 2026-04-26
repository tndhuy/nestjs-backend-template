"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
const cockatiel_1 = require("cockatiel");
const api_1 = require("@opentelemetry/api");
const tracer = api_1.trace.getTracer('redis-service');
let RedisService = RedisService_1 = class RedisService {
    client;
    logger = new common_1.Logger(RedisService_1.name);
    policy;
    constructor() {
        this.policy = (0, cockatiel_1.circuitBreaker)(cockatiel_1.handleAll, {
            halfOpenAfter: 10_000,
            breaker: new cockatiel_1.ConsecutiveBreaker(5),
        });
        this.client = new ioredis_1.default(process.env.REDIS_URL, {
            commandTimeout: 5000,
            connectTimeout: 5000,
            enableOfflineQueue: false,
            maxRetriesPerRequest: 3,
        });
        this.client.on('connect', () => this.logger.log('Redis connected'));
        this.client.on('error', (err) => this.logger.error('Redis error', err.message));
    }
    async onModuleDestroy() {
        await this.client?.quit();
        this.logger.log('Redis disconnected');
    }
    getClient() {
        return this.client;
    }
    async execute(fn) {
        return this.policy.execute(() => fn(this.client));
    }
    async get(key) {
        return tracer.startActiveSpan('redis.get', async (span) => {
            try {
                span.setAttribute('db.system', 'redis');
                span.setAttribute('db.operation', 'get');
                span.setAttribute('db.redis.key', key);
                return await this.execute((c) => c.get(key));
            }
            catch (error) {
                span.recordException(error);
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
    async set(key, value, ttlSeconds) {
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
                    }
                    else {
                        await c.set(key, value);
                    }
                });
            }
            catch (error) {
                span.recordException(error);
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
    async del(key) {
        return tracer.startActiveSpan('redis.del', async (span) => {
            try {
                span.setAttribute('db.system', 'redis');
                span.setAttribute('db.operation', 'del');
                span.setAttribute('db.redis.key', key);
                await this.execute((c) => c.del(key).then(() => undefined));
            }
            catch (error) {
                span.recordException(error);
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
    async expire(key, ttlSeconds) {
        return tracer.startActiveSpan('redis.expire', async (span) => {
            try {
                span.setAttribute('db.system', 'redis');
                span.setAttribute('db.operation', 'expire');
                span.setAttribute('db.redis.key', key);
                span.setAttribute('db.redis.ttl', ttlSeconds);
                await this.execute((c) => c.expire(key, ttlSeconds).then(() => undefined));
            }
            catch (error) {
                span.recordException(error);
                throw error;
            }
            finally {
                span.end();
            }
        });
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RedisService);
//# sourceMappingURL=redis.service.js.map