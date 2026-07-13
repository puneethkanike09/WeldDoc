export interface RateLimitOptions {
  max: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export interface RateLimiter {
  check(key: string, options: RateLimitOptions, now?: number): RateLimitResult;
}

/** In-memory sliding window. Swap for Redis later via the RateLimiter interface. */
export class MemoryRateLimiter implements RateLimiter {
  private hits = new Map<string, number[]>();

  check(
    key: string,
    options: RateLimitOptions,
    now = Date.now(),
  ): RateLimitResult {
    const cutoff = now - options.windowMs;
    const timestamps = (this.hits.get(key) ?? []).filter((t) => t > cutoff);

    if (timestamps.length >= options.max) {
      const oldest = timestamps[0]!;
      this.hits.set(key, timestamps);
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, oldest + options.windowMs - now),
      };
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);
    return {
      allowed: true,
      remaining: options.max - timestamps.length,
      retryAfterMs: 0,
    };
  }
}

export const globalRateLimiter = new MemoryRateLimiter();
