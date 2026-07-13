import { z } from "zod";
import type { RateLimiter } from "@/lib/rate-limit";
import {
  RATE_LIMITS,
  type AuthResult,
  normalizeEmail as defaultNormalize,
} from "@/lib/auth/types";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export interface PasswordResetDeps {
  findUserByEmail: (email: string) => Promise<{ id: string } | null>;
  generateRecoveryLink: (
    email: string,
  ) => Promise<{ actionLink: string } | { error: string }>;
  sendPasswordResetEmail: (input: {
    to: string;
    actionLink: string;
  }) => Promise<{ sent: boolean; error?: string }>;
  rateLimiter: RateLimiter;
  normalizeEmail: (email: string) => string;
}

const GENERIC_OK =
  "If an account exists for that email, a password reset link has been sent.";

export async function requestPasswordReset(
  input: { email: string },
  deps: PasswordResetDeps,
): Promise<AuthResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid email.",
    };
  }

  const normalize = deps.normalizeEmail ?? defaultNormalize;
  const email = normalize(parsed.data.email);

  const cooldown = deps.rateLimiter.check(
    `reset:cooldown:${email}`,
    RATE_LIMITS.resetCooldown,
  );
  if (!cooldown.allowed) {
    return {
      success: false,
      code: "RATE_LIMITED",
      message: "Please wait a minute before requesting another reset email.",
    };
  }

  const hour = deps.rateLimiter.check(
    `reset:email:${email}`,
    RATE_LIMITS.resetPerEmail,
  );
  if (!hour.allowed) {
    return {
      success: false,
      code: "RATE_LIMITED",
      message: "Too many password reset requests. Please try again later.",
    };
  }

  const user = await deps.findUserByEmail(email);
  if (!user) {
    return { success: true, message: GENERIC_OK };
  }

  const link = await deps.generateRecoveryLink(email);
  if ("error" in link) {
    return {
      success: false,
      code: "INTERNAL_ERROR",
      message: "Unable to create reset link. Please try again.",
    };
  }

  const sent = await deps.sendPasswordResetEmail({
    to: email,
    actionLink: link.actionLink,
  });
  if (!sent.sent) {
    return {
      success: false,
      code: "EMAIL_SEND_FAILED",
      message: "Unable to send password reset email. Please try again.",
    };
  }

  return { success: true, message: GENERIC_OK };
}
