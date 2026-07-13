import { requestPasswordReset } from "@/lib/auth/password-reset";
import { jsonAuthResult } from "@/lib/auth/http";
import { globalRateLimiter } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/auth/types";
import {
  adminGenerateRecoveryLink,
  findAuthUserByEmail,
} from "@/lib/auth/supabase-admin";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonAuthResult({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Invalid JSON body.",
    });
  }

  const input = body as { email?: string };

  const result = await requestPasswordReset(
    { email: input.email ?? "" },
    {
      findUserByEmail: findAuthUserByEmail,
      generateRecoveryLink: adminGenerateRecoveryLink,
      sendPasswordResetEmail,
      rateLimiter: globalRateLimiter,
      normalizeEmail,
    },
  );

  return jsonAuthResult(result);
}
