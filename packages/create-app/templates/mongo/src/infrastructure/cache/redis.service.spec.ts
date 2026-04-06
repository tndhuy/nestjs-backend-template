import { RedisService } from './redis.service';
import { trace } from '@opentelemetry/api';

// ---- ioredis mock ----
const mockRedisOn = jest.fn();
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockDel = jest.fn();
const mockExpire = jest.fn();
const mockQuit = jest.fn().mockResolvedValue('OK');

const mockRedisInstance = {
  on: mockRedisOn,
  get: mockGet,
  set: mockSet,
  del: mockDel,
  expire: mockExpire,
  quit: mockQuit,
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedisInstance);
});

// ---- cockatiel mock ----
// circuitBreaker returns a policy whose execute() just calls the fn directly
const mockPolicyExecute = jest.fn((fn: () => Promise<unknown>) => fn());

jest.mock('cockatiel', () => ({
  circuitBreaker: jest.fn(() => ({ execute: mockPolicyExecute })),
  ConsecutiveBreaker: jest.fn(),
  handleAll: {},
}));

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-establish required mock implementations after clearAllMocks()
    mockQuit.mockResolvedValue('OK');
    mockPolicyExecute.mockImplementation((fn: () => Promise<unknown>) => fn());
    process.env.REDIS_URL = 'redis://localhost:6379';
    service = new RedisService();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  describe('constructor', () => {
    it('should initialise the Redis client immediately in the constructor', () => {
      // The Redis constructor mock should have been called once
      const RedisMock = require('ioredis');
      expect(RedisMock).toHaveBeenCalledWith(
        process.env.REDIS_URL,
        expect.objectContaining({ enableOfflineQueue: false }),
      );
    });

    it('should register connect and error event listeners on the client', () => {
      expect(mockRedisOn).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockRedisOn).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('get', () => {
    it('should return the cached value for a key', async () => {
      mockGet.mockResolvedValue('cached-value');
      const result = await service.get('some-key');
      expect(mockGet).toHaveBeenCalledWith('some-key');
      expect(result).toBe('cached-value');
    });

    it('should return null when key does not exist', async () => {
      mockGet.mockResolvedValue(null);
      const result = await service.get('missing-key');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set a key-value pair without TTL', async () => {
      mockSet.mockResolvedValue('OK');
      await service.set('key', 'value');
      expect(mockSet).toHaveBeenCalledWith('key', 'value');
    });

    it('should set a key-value pair with TTL in seconds', async () => {
      mockSet.mockResolvedValue('OK');
      await service.set('key', 'value', 60);
      expect(mockSet).toHaveBeenCalledWith('key', 'value', 'EX', 60);
    });
  });

  describe('del', () => {
    it('should delete a key from the cache', async () => {
      mockDel.mockResolvedValue(1);
      await service.del('key-to-delete');
      expect(mockDel).toHaveBeenCalledWith('key-to-delete');
    });
  });

  describe('expire', () => {
    it('should set an expiry time on an existing key', async () => {
      mockExpire.mockResolvedValue(1);
      await service.expire('some-key', 300);
      expect(mockExpire).toHaveBeenCalledWith('some-key', 300);
    });
  });

  describe('execute (circuit breaker)', () => {
    it('should delegate operations through the circuit breaker policy', async () => {
      mockGet.mockResolvedValue('value');
      await service.get('test');
      expect(mockPolicyExecute).toHaveBeenCalled();
    });

    it('should propagate errors when the circuit breaker is open', async () => {
      const circuitOpenError = new Error('Circuit breaker is open');
      mockPolicyExecute.mockRejectedValueOnce(circuitOpenError);
      await expect(service.get('any-key')).rejects.toThrow(
        'Circuit breaker is open',
      );
    });
  });

  describe('getClient', () => {
    it('should return the underlying Redis client instance', () => {
      const client = service.getClient();
      expect(client).toBe(mockRedisInstance);
    });
  });

  describe('onModuleDestroy', () => {
    it('should quit the Redis client on module destroy', async () => {
      await service.onModuleDestroy();
      expect(mockQuit).toHaveBeenCalled();
    });
  });

  describe('OTel tracing', () => {
    it('should expose the OTel trace API (smoke test)', () => {
      // When OTel SDK is not initialized, getTracer returns a no-op tracer
      const t = trace.getTracer('test');
      expect(t).toBeDefined();
    });

    it('get() should still resolve correctly with OTel no-op spans', async () => {
      mockGet.mockResolvedValue('traced-value');
      const result = await service.get('otel-key');
      expect(result).toBe('traced-value');
      expect(mockGet).toHaveBeenCalledWith('otel-key');
    });

    it('set() should still resolve correctly with OTel no-op spans', async () => {
      mockSet.mockResolvedValue('OK');
      await service.set('otel-key', 'otel-value', 30);
      expect(mockSet).toHaveBeenCalledWith('otel-key', 'otel-value', 'EX', 30);
    });

    it('del() should still resolve correctly with OTel no-op spans', async () => {
      mockDel.mockResolvedValue(1);
      await service.del('otel-key');
      expect(mockDel).toHaveBeenCalledWith('otel-key');
    });

    it('expire() should still resolve correctly with OTel no-op spans', async () => {
      mockExpire.mockResolvedValue(1);
      await service.expire('otel-key', 120);
      expect(mockExpire).toHaveBeenCalledWith('otel-key', 120);
    });
  });
});
