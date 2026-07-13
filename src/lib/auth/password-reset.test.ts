import { describe, expect, it, vi } from "vitest";
import { requestPasswordReset } from "@/lib/auth/password-reset";
import type { PasswordResetDeps } from "@/lib/auth/password-reset";
import { MemoryRateLimiter } from "@/lib/rate-limit";

function makeDeps(
  overrides: Partial<PasswordResetDeps> = {},
): PasswordResetDeps {
  return {
    findUserByEmail: vi.fn(async () => ({ id: "u1" })),
    generateRecoveryLink: vi.fn(async () => ({
      actionLink: "https://supabase.test/recover",
    })),
    sendPasswordResetEmail: vi.fn(async () => ({ sent: true })),
    rateLimiter: new MemoryRateLimiter(),
    normalizeEmail: (email) => email.trim().toLowerCase(),
    ...overrides,
  };
}

describe("requestPasswordReset", () => {
  it("rejects invalid email", async () => {
    const result = await requestPasswordReset({ email: "" }, makeDeps());
    expect(result).toMatchObject({ success: false, code: "VALIDATION_ERROR" });
  });

  it("returns generic success when user does not exist", async () => {
    const deps = makeDeps({ findUserByEmail: async () => null });
    const result = await requestPasswordReset({ email: "missing@ex.com" }, deps);
    expect(result.success).toBe(true);
    expect(deps.generateRecoveryLink).not.toHaveBeenCalled();
  });

  it("sends recovery email for existing user", async () => {
    const deps = makeDeps();
    const result = await requestPasswordReset({ email: "A@Ex.COM" }, deps);
    expect(result.success).toBe(true);
    expect(deps.sendPasswordResetEmail).toHaveBeenCalledWith({
      to: "a@ex.com",
      actionLink: "https://supabase.test/recover",
    });
  });

  it("rate limits repeated reset requests", async () => {
    const deps = makeDeps();
    expect((await requestPasswordReset({ email: "a@ex.com" }, deps)).success).toBe(
      true,
    );
    const blocked = await requestPasswordReset({ email: "a@ex.com" }, deps);
    expect(blocked).toMatchObject({ success: false, code: "RATE_LIMITED" });
  });
});
