import { beforeEach, describe, expect, it } from "vitest";
import { MemoryRateLimiter } from "@/lib/rate-limit";

describe("MemoryRateLimiter", () => {
  let limiter: MemoryRateLimiter;

  beforeEach(() => {
    limiter = new MemoryRateLimiter();
  });

  it("allows requests under the limit", () => {
    expect(limiter.check("k", { max: 2, windowMs: 60_000 }).allowed).toBe(true);
    expect(limiter.check("k", { max: 2, windowMs: 60_000 }).allowed).toBe(true);
  });

  it("blocks when max exceeded within window", () => {
    limiter.check("k", { max: 1, windowMs: 60_000 });
    const blocked = limiter.check("k", { max: 1, windowMs: 60_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("isolates keys", () => {
    limiter.check("a", { max: 1, windowMs: 60_000 });
    expect(limiter.check("b", { max: 1, windowMs: 60_000 }).allowed).toBe(true);
  });

  it("allows again after the window expires", () => {
    const t0 = 1_000_000;
    expect(limiter.check("k", { max: 1, windowMs: 1000 }, t0).allowed).toBe(true);
    expect(limiter.check("k", { max: 1, windowMs: 1000 }, t0 + 500).allowed).toBe(
      false,
    );
    expect(limiter.check("k", { max: 1, windowMs: 1000 }, t0 + 1001).allowed).toBe(
      true,
    );
  });
});
