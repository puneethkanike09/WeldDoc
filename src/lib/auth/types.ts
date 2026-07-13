export type AuthErrorCode =
  | "VALIDATION_ERROR"
  | "EMAIL_ALREADY_EXISTS"
  | "RATE_LIMITED"
  | "EMAIL_SEND_FAILED"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export type AuthResult<T = undefined> =
  | { success: true; message?: string; data?: T }
  | { success: false; message: string; code: AuthErrorCode };

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const HOUR_MS = 60 * 60 * 1000;
export const COOLDOWN_MS = 60 * 1000;

export const RATE_LIMITS = {
  signupPerIp: { max: 10, windowMs: HOUR_MS },
  verifyPerEmail: { max: 15, windowMs: HOUR_MS },
  verifyCooldown: { max: 1, windowMs: COOLDOWN_MS },
  resetPerEmail: { max: 15, windowMs: HOUR_MS },
  resetCooldown: { max: 1, windowMs: COOLDOWN_MS },
} as const;
