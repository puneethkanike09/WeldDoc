import { z } from "zod";
import type { RateLimiter } from "@/lib/rate-limit";
import {
  RATE_LIMITS,
  type AuthResult,
  normalizeEmail as defaultNormalize,
} from "@/lib/auth/types";

const signupSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export interface SignupInput {
  fullName: string;
  email: string;
  password: string;
}

export interface SignupDeps {
  createUser: (input: {
    email: string;
    password: string;
    fullName: string;
  }) => Promise<{ userId: string } | { error: string; code?: string }>;
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

export async function signup(
  input: SignupInput,
  deps: SignupDeps,
  ip: string,
): Promise<AuthResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const normalize = deps.normalizeEmail ?? defaultNormalize;
  const email = normalize(parsed.data.email);
  const fullName = parsed.data.fullName.trim();
  const { password } = parsed.data;

  const ipLimit = deps.rateLimiter.check(
    `signup:ip:${ip || "unknown"}`,
    RATE_LIMITS.signupPerIp,
  );
  if (!ipLimit.allowed) {
    return {
      success: false,
      code: "RATE_LIMITED",
      message: "Too many signup attempts. Please try again later.",
    };
  }

  const verifyHour = deps.rateLimiter.check(
    `verify:email:${email}`,
    RATE_LIMITS.verifyPerEmail,
  );
  if (!verifyHour.allowed) {
    return {
      success: false,
      code: "RATE_LIMITED",
      message: "Too many verification emails. Please try again later.",
    };
  }

  const created = await deps.createUser({ email, password, fullName });
  if ("error" in created) {
    const duplicate =
      created.code === "email_exists" ||
      /already|registered|exists/i.test(created.error);
    return {
      success: false,
      code: duplicate ? "EMAIL_ALREADY_EXISTS" : "INTERNAL_ERROR",
      message: duplicate
        ? "An account with this email already exists."
        : "Unable to create account. Please try again.",
    };
  }

  const link = await deps.generateVerificationLink(email);
  if ("error" in link) {
    return {
      success: false,
      code: "INTERNAL_ERROR",
      message: "Unable to create verification link. Please try again.",
    };
  }

  deps.rateLimiter.check(`verify:cooldown:${email}`, RATE_LIMITS.verifyCooldown);

  const sent = await deps.sendVerificationEmail({
    to: email,
    fullName,
    actionLink: link.actionLink,
  });
  if (!sent.sent) {
    return {
      success: false,
      code: "EMAIL_SEND_FAILED",
      message: "Account created, but we could not send the verification email.",
    };
  }

  return {
    success: true,
    message: "Account created. Check your email to confirm, then sign in.",
  };
}
