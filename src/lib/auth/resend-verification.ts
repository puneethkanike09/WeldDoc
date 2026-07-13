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

export interface ResendVerificationDeps {
  findUserByEmail: (email: string) => Promise<{
    id: string;
    emailConfirmed: boolean;
    fullName: string;
  } | null>;
  generateVerificationLink: (
    email: string,
  ) => Promise<{ actionLink: string } | { error: string }>;
  sendVerificationEmail: (input: {
    to: string;
    fullName: string;
    actionLink: string;
  }) => Promise<{ sent: boolean; error?: string }>;
  rateLimiter: RateLimiter;
  normalizeEmail: (email: string) => string;
}

const GENERIC_OK =
  "If an unverified account exists for that email, a verification link has been sent.";

export async function resendVerification(
  input: { email: string },
  deps: ResendVerificationDeps,
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
    `verify:cooldown:${email}`,
    RATE_LIMITS.verifyCooldown,
  );
  if (!cooldown.allowed) {
    return {
      success: false,
      code: "RATE_LIMITED",
      message: "Please wait a minute before requesting another email.",
    };
  }

  const hour = deps.rateLimiter.check(
    `verify:email:${email}`,
    RATE_LIMITS.verifyPerEmail,
  );
  if (!hour.allowed) {
    return {
      success: false,
      code: "RATE_LIMITED",
      message: "Too many verification emails. Please try again later.",
    };
  }

  const user = await deps.findUserByEmail(email);
  if (!user || user.emailConfirmed) {
    return { success: true, message: GENERIC_OK };
  }

  const link = await deps.generateVerificationLink(email);
  if ("error" in link) {
    return {
      success: false,
      code: "INTERNAL_ERROR",
      message: "Unable to create verification link. Please try again.",
    };
  }

  const sent = await deps.sendVerificationEmail({
    to: email,
    fullName: user.fullName,
    actionLink: link.actionLink,
  });
  if (!sent.sent) {
    return {
      success: false,
      code: "EMAIL_SEND_FAILED",
      message: "Unable to send verification email. Please try again.",
    };
  }

  return { success: true, message: GENERIC_OK };
}
