# Custom Auth Email (Resend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Supabase-sent verification/reset emails with Resend-backed APIs while keeping Supabase Auth for users, tokens, and sessions.

**Architecture:** Server routes call admin `createUser` / `generateLink`, send mail via existing Resend helpers, in-memory rate limits; login form signup switches to API.

**Tech Stack:** Next.js App Router, Supabase Admin API, Resend (`src/lib/email.ts`), Zod, Vitest

---

## File map

| File | Action |
|------|--------|
| `vitest.config.ts` | Create |
| `package.json` | Add vitest scripts + deps |
| `src/lib/rate-limit.ts` | Create |
| `src/lib/auth/types.ts` | Create |
| `src/lib/auth/signup.ts` | Create |
| `src/lib/auth/resend-verification.ts` | Create |
| `src/lib/auth/password-reset.ts` | Create |
| `src/lib/auth/check-email.ts` | Create |
| `src/lib/email.ts` | Add verification + reset senders |
| `src/app/api/auth/signup/route.ts` | Create |
| `src/app/api/auth/resend-verification/route.ts` | Create |
| `src/app/api/auth/forgot-password/route.ts` | Create |
| `src/app/api/auth/check-email/route.ts` | Create |
| `src/app/auth/callback/route.ts` | Create |
| `src/app/(auth)/reset-password/page.tsx` | Create |
| `src/app/(auth)/reset-password/reset-password-form.tsx` | Create |
| `src/app/(auth)/login/login-form.tsx` | Modify |
| `src/lib/rate-limit.test.ts` | Create |
| `src/lib/auth/signup.test.ts` | Create |
| `src/lib/auth/password-reset.test.ts` | Create |
| `src/lib/auth/resend-verification.test.ts` | Create |
| `src/lib/email-auth.test.ts` | Create |

---

### Task 1: Vitest harness

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Add vitest config**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 2: Install + script**

```bash
npm install -D vitest
```

Add script: `"test": "vitest run"`, `"test:watch": "vitest"`

- [ ] **Step 3: Commit** — `chore: add vitest for unit tests`

---

### Task 2: In-memory rate limiter (TDD)

**Files:**
- Create: `src/lib/rate-limit.ts`
- Test: `src/lib/rate-limit.test.ts`

- [ ] **Step 1: Failing tests**

```ts
import { describe, it, expect, beforeEach } from "vitest";
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
    expect(limiter.check("k", { max: 1, windowMs: 60_000 }).allowed).toBe(false);
  });

  it("isolates keys", () => {
    limiter.check("a", { max: 1, windowMs: 60_000 });
    expect(limiter.check("b", { max: 1, windowMs: 60_000 }).allowed).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (`MemoryRateLimiter` missing)

- [ ] **Step 3: Implement**

```ts
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
  check(key: string, options: RateLimitOptions): RateLimitResult;
}

export class MemoryRateLimiter implements RateLimiter {
  private hits = new Map<string, number[]>();

  check(key: string, options: RateLimitOptions, now = Date.now()): RateLimitResult {
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
```

- [ ] **Step 4: Run tests — PASS**

- [ ] **Step 5: Commit** — `feat: add in-memory rate limiter`

---

### Task 3: Auth email templates (TDD)

**Files:**
- Modify: `src/lib/email.ts` — export builders + send helpers
- Test: `src/lib/email-auth.test.ts`

- [ ] **Step 1: Failing tests** for `verificationEmailHtml` / `passwordResetEmailHtml` containing CTA href and fallback URL

- [ ] **Step 2: Implement HTML builders + `sendVerificationEmail` / `sendPasswordResetEmail`** using existing `emailShell`

- [ ] **Step 3: Tests PASS + commit** — `feat: add verification and password-reset email templates`

---

### Task 4: Signup service (TDD)

**Files:**
- Create: `src/lib/auth/types.ts`, `src/lib/auth/signup.ts`
- Test: `src/lib/auth/signup.test.ts`

Deps injected:

```ts
export interface SignupDeps {
  createUser: (input: {
    email: string;
    password: string;
    fullName: string;
  }) => Promise<{ userId: string } | { error: string; code?: string }>;
  generateVerificationLink: (email: string) => Promise<
    { actionLink: string } | { error: string }
  >;
  sendVerificationEmail: (input: {
    to: string;
    fullName: string;
    actionLink: string;
  }) => Promise<{ sent: boolean; error?: string }>;
  rateLimiter: RateLimiter;
  normalizeEmail: (email: string) => string;
}
```

Behaviors:
- validation fail → `VALIDATION_ERROR`
- rate limit IP → `RATE_LIMITED`
- createUser duplicate → `EMAIL_ALREADY_EXISTS`
- send fail → `EMAIL_SEND_FAILED`
- success → `{ success: true }`

- [ ] **Step 1–4: RED → GREEN → commit** — `feat: add signup auth service`

---

### Task 5: Resend verification + password reset services (TDD)

Same DI pattern. Forgot-password always returns success for valid email (even if user missing). Apply email rate limits + 60s cooldown.

- [ ] Tests + impl + commit — `feat: add resend-verification and password-reset services`

---

### Task 6: API routes

Wire Zod + services + `createAdminClient` + real `send*` from email.ts + `globalRateLimiter`. Extract client IP from `x-forwarded-for` / `x-real-ip`.

- [ ] Commit — `feat: add auth API routes for signup, resend, reset, check-email`

---

### Task 7: Auth callback + reset password UI

- `/auth/callback` exchanges code, redirects to `/auth/reset-password` or `/login`
- Reset form: `supabase.auth.updateUser({ password })`
- Allow `/auth/*` through middleware (not protected)

- [ ] Commit — `feat: add auth callback and reset-password page`

---

### Task 8: Login form integration

- Signup → `POST /api/auth/signup`
- Add forgot-password mode calling `/api/auth/forgot-password`
- On sign-in error suggesting unconfirmed email, offer resend via `/api/auth/resend-verification`
- Handle `?verified=1` notice

- [ ] Commit — `feat: wire login form to custom auth email APIs`

---

### Task 9: Verification

```bash
npm test
npm run lint
```

Confirm all unit tests pass. Note: full email delivery requires live Supabase + Resend env.

---

## Spec coverage

| Spec item | Task |
|-----------|------|
| Admin createUser + generateLink | 4, 6 |
| Resend verification/reset emails | 3–5 |
| Rate limits in-memory | 2, 4–5 |
| API routes | 6 |
| Login form no client signUp | 8 |
| Password reset UI | 7 |
| Unit tests | 1–5 |
| No invitations | — excluded |
