import { RateLimiterMemory } from 'rate-limiter-flexible';

export class RateLimiter {
  private static instance: RateLimiter;
  private limiter: RateLimiterMemory;

  private constructor() {
    this.limiter = new RateLimiterMemory({
      points: 10, // Number of points
      duration: 1, // Per second
    });
  }

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  async checkLimit(key: string): Promise<boolean> {
    try {
      await this.limiter.consume(key);
      return true;
    } catch (error) {
      return false;
    }
  }
}