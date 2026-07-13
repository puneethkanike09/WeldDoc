# Custom Auth Email (Resend) — Design Spec

**Date:** 2026-07-13  
**Status:** Approved  
**Scope:** Email verification + password reset via Resend; Supabase Auth retained

---

## Problem

Signup currently calls client-side `supabase.auth.signUp()`, which triggers Supabase’s built-in verification email. We need full control over branding, rate limiting, and deliverability while keeping Supabase for auth, sessions, JWTs, and `email_confirmed` state.

## Goals

1. Supabase Auth remains the source of truth for users, sessions, and verification tokens.
2. All auth emails (verification, password reset) are sent by our backend via Resend.
3. Signup does not auto-login until email is verified.
4. In-memory rate limiting (no Redis for now).
5. Consistent JSON API errors; no raw Supabase errors to clients.
6. Unit tests for auth services, rate limiter, and email HTML builders.

## Non-goals

- Team/org invitations
- Redis-backed rate limiting
- React Email package (use existing HTML helpers in `src/lib/email.ts`)
- Custom JWT verification tokens (use Supabase `generateLink`)

## Architecture

```
Signup:  LoginForm → POST /api/auth/signup
           → admin.createUser(email_confirm: false)
           → handle_new_user trigger (org + profile)
           → admin.generateLink(type: signup)
           → sendVerificationEmail (Resend)
           → { success: true } (no session)

Verify:  User clicks Supabase action_link
           → Supabase marks email confirmed
           → redirect to /login?verified=1

Reset:   Forgot form → POST /api/auth/forgot-password
           → admin.generateLink(type: recovery)
           → sendPasswordResetEmail (Resend)
           → always generic success (anti-enumeration)

         User clicks recovery link → /auth/callback
           → exchange session → /auth/reset-password
           → updateUser({ password })
```

**Ops:** Keep “Confirm email” enabled in Supabase Dashboard. Never call client `signUp` / `resetPasswordForEmail` (those send Supabase mail).

## Modules

| Path | Responsibility |
|------|----------------|
| `src/lib/rate-limit.ts` | In-memory window limiter + injectable store interface |
| `src/lib/auth/errors.ts` | Typed result helpers / error codes |
| `src/lib/auth/signup.ts` | Signup orchestration |
| `src/lib/auth/resend-verification.ts` | Resend verification email |
| `src/lib/auth/password-reset.ts` | Forgot-password orchestration |
| `src/lib/auth/check-email.ts` | Email existence check |
| `src/lib/email.ts` | Add `sendVerificationEmail`, `sendPasswordResetEmail` |
| `src/app/api/auth/*/route.ts` | Thin HTTP adapters |
| `src/app/(auth)/login/login-form.tsx` | Signup via API; forgot + resend UX |
| `src/app/auth/callback/route.ts` | Supabase code exchange |
| `src/app/(auth)/reset-password/*` | Set new password UI |

## API contracts

All JSON responses:

```ts
{ success: true, data?: T, message?: string }
{ success: false, message: string, code: string }
```

| Route | Method | Notes |
|-------|--------|-------|
| `/api/auth/signup` | POST | `{ fullName, email, password }` |
| `/api/auth/resend-verification` | POST | `{ email }` |
| `/api/auth/forgot-password` | POST | `{ email }` — always success message if valid email shape |
| `/api/auth/check-email` | POST | `{ email }` → `{ exists: boolean }` |

### Error codes

`VALIDATION_ERROR`, `EMAIL_ALREADY_EXISTS`, `RATE_LIMITED`, `EMAIL_SEND_FAILED`, `NOT_FOUND`, `INTERNAL_ERROR`

## Rate limits (in-memory)

| Key | Limit |
|-----|-------|
| `signup:ip:{ip}` | 10 / hour |
| `verify:email:{email}` | 15 / hour |
| `verify:cooldown:{email}` | 1 / 60s |
| `reset:email:{email}` | 15 / hour |
| `reset:cooldown:{email}` | 1 / 60s |

## Email templates

Reuse Forge Steel shell (`emailHeader` / `emailShell`): logo wordmark, welcome/reset copy, CTA button, fallback URL, expiry notice (~24h), support `hello@welddoc.in`.

## Security

- Service role only on server.
- Zod validation on all inputs.
- Forgot-password does not reveal whether email exists.
- Signup may return `EMAIL_ALREADY_EXISTS` (explicit UX choice).

## Testing

- Vitest unit tests for rate limiter, signup/reset services (mocked admin + email), and email HTML contains CTA/URL.
- Manual / e2e: signup form no longer calls `signUp`; login still uses `signInWithPassword`.

## Env

Existing: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL`.
