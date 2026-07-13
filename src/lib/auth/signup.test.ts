import { describe, expect, it, vi } from "vitest";
import { signup } from "@/lib/auth/signup";
import type { SignupDeps } from "@/lib/auth/signup";
import { MemoryRateLimiter } from "@/lib/rate-limit";

function makeDeps(overrides: Partial<SignupDeps> = {}): SignupDeps {
  return {
    createUser: vi.fn(async () => ({ userId: "user-1" })),
    generateVerificationLink: vi.fn(async () => ({
      actionLink: "https://supabase.test/verify",
    })),
    sendVerificationEmail: vi.fn(async () => ({ sent: true })),
    rateLimiter: new MemoryRateLimiter(),
    normalizeEmail: (email) => email.trim().toLowerCase(),
    ...overrides,
  };
}

describe("signup", () => {
  it("rejects invalid input", async () => {
    const result = await signup(
      { fullName: "", email: "bad", password: "123" },
      makeDeps(),
      "1.2.3.4",
    );
    expect(result).toEqual({
      success: false,
      code: "VALIDATION_ERROR",
      message: expect.any(String),
    });
  });

  it("rate limits by IP", async () => {
    const deps = makeDeps();
    for (let i = 0; i < 5; i++) {
      await signup(
        {
          fullName: "Alex",
          email: `a${i}@ex.com`,
          password: "secret12",
        },
        deps,
        "9.9.9.9",
      );
    }
    const blocked = await signup(
      { fullName: "Alex", email: "z@ex.com", password: "secret12" },
      deps,
      "9.9.9.9",
    );
    expect(blocked.success).toBe(false);
    if (!blocked.success) expect(blocked.code).toBe("RATE_LIMITED");
  });

  it("maps duplicate email to EMAIL_ALREADY_EXISTS", async () => {
    const deps = makeDeps({
      createUser: async () => ({ error: "exists", code: "email_exists" }),
    });
    const result = await signup(
      { fullName: "Alex", email: "a@ex.com", password: "secret12" },
      deps,
      "1.1.1.1",
    );
    expect(result).toMatchObject({
      success: false,
      code: "EMAIL_ALREADY_EXISTS",
    });
  });

  it("creates user, generates link, and sends email", async () => {
    const deps = makeDeps();
    const result = await signup(
      { fullName: "Alex", email: "A@Ex.COM", password: "secret12" },
      deps,
      "1.1.1.1",
    );
    expect(result).toEqual({
      success: true,
      message: expect.stringContaining("Check your email"),
    });
    expect(deps.createUser).toHaveBeenCalledWith({
      email: "a@ex.com",
      password: "secret12",
      fullName: "Alex",
    });
    expect(deps.generateVerificationLink).toHaveBeenCalledWith("a@ex.com");
    expect(deps.sendVerificationEmail).toHaveBeenCalledWith({
      to: "a@ex.com",
      fullName: "Alex",
      actionLink: "https://supabase.test/verify",
    });
  });

  it("returns EMAIL_SEND_FAILED when Resend fails", async () => {
    const deps = makeDeps({
      sendVerificationEmail: async () => ({
        sent: false,
        error: "boom",
      }),
    });
    const result = await signup(
      { fullName: "Alex", email: "a@ex.com", password: "secret12" },
      deps,
      "1.1.1.1",
    );
    expect(result).toMatchObject({
      success: false,
      code: "EMAIL_SEND_FAILED",
    });
  });
});
