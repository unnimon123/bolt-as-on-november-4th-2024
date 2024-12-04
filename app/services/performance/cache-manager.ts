import NodeCache from 'node-cache';
import Redis from 'ioredis';

export class QueryCache {
  private localCache: NodeCache;
  private redisClient: Redis;
  private readonly DEFAULT_TTL = 300; // 5 minutes

  constructor() {
    this.localCache = new NodeCache({
      stdTTL: this.DEFAULT_TTL,
      checkperiod: 120
    });

    this.redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });
  }

  async get<T>(key: string): Promise<T | null> {
    // Try local cache first
    const localValue = this.localCache.get<T>(key);
    if (localValue) return localValue;

    // Try Redis
    const redisValue = await this.redisClient.get(key);
    if (redisValue) {
      const parsed = JSON.parse(redisValue);
      this.localCache.set(key, parsed);
      return parsed;
    }

    return null;
  }

  async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    const serialized = JSON.stringify(value);

    // Set in both caches
    this.localCache.set(key, value, ttl);
    await this.redisClient.setex(key, ttl, serialized);
  }

  async invalidate(pattern: string): Promise<void> {
    // Clear local cache
    const localKeys = this.localCache.keys();
    localKeys.forEach(key => {
      if (key.includes(pattern)) {
        this.localCache.del(key);
      }
    });

    // Clear Redis cache
    const redisKeys = await this.redisClient.keys(`*${pattern}*`);
    if (redisKeys.length > 0) {
      await this.redisClient.del(...redisKeys);
    }
  }
}