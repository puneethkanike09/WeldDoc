import { describe, expect, it, vi } from "vitest";
import { resendVerification } from "@/lib/auth/resend-verification";
import type { ResendVerificationDeps } from "@/lib/auth/resend-verification";
import { MemoryRateLimiter } from "@/lib/rate-limit";

function makeDeps(
  overrides: Partial<ResendVerificationDeps> = {},
): ResendVerificationDeps {
  return {
    findUserByEmail: vi.fn(async () => ({
      id: "u1",
      emailConfirmed: false,
      fullName: "Alex",
    })),
    generateVerificationLink: vi.fn(async () => ({
      actionLink: "https://supabase.test/verify",
    })),
    sendVerificationEmail: vi.fn(async () => ({ sent: true })),
    rateLimiter: new MemoryRateLimiter(),
    normalizeEmail: (email) => email.trim().toLowerCase(),
    ...overrides,
  };
}

describe("resendVerification", () => {
  it("rejects invalid email", async () => {
    const result = await resendVerification({ email: "nope" }, makeDeps());
    expect(result).toMatchObject({ success: false, code: "VALIDATION_ERROR" });
  });

  it("returns generic success when user missing (anti-enumeration)", async () => {
    const deps = makeDeps({
      findUserByEmail: async () => null,
    });
    const result = await resendVerification({ email: "a@ex.com" }, deps);
    expect(result.success).toBe(true);
    expect(deps.generateVerificationLink).not.toHaveBeenCalled();
  });

  it("returns success when already verified without sending", async () => {
    const deps = makeDeps({
      findUserByEmail: async () => ({
        id: "u1",
        emailConfirmed: true,
        fullName: "Alex",
      }),
    });
    const result = await resendVerification({ email: "a@ex.com" }, deps);
    expect(result.success).toBe(true);
    expect(deps.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("enforces cooldown between resends", async () => {
    const deps = makeDeps();
    const first = await resendVerification({ email: "a@ex.com" }, deps);
    expect(first.success).toBe(true);
    const second = await resendVerification({ email: "a@ex.com" }, deps);
    expect(second).toMatchObject({ success: false, code: "RATE_LIMITED" });
  });

  it("sends a new verification email", async () => {
    const deps = makeDeps();
    const result = await resendVerification({ email: "A@Ex.COM" }, deps);
    expect(result.success).toBe(true);
    expect(deps.sendVerificationEmail).toHaveBeenCalledWith({
      to: "a@ex.com",
      fullName: "Alex",
      actionLink: "https://supabase.test/verify",
    });
  });
});
