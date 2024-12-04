import { RateLimiter } from '../../services/security/rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = RateLimiter.getInstance();
  });

  it('should allow requests within limit', async () => {
    const result = await rateLimiter.checkLimit('test-key');
    expect(result).toBe(true);
  });

  it('should block excessive requests', async () => {
    // Make 11 requests (exceeding limit of 10)
    for (let i = 0; i < 10; i++) {
      await rateLimiter.checkLimit('test-key');
    }
    const result = await rateLimiter.checkLimit('test-key');
    expect(result).toBe(false);
  });
});