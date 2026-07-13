import { resendVerification } from "@/lib/auth/resend-verification";
import { jsonAuthResult } from "@/lib/auth/http";
import { globalRateLimiter } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/auth/types";
import {
  adminGenerateVerificationLink,
  findAuthUserByEmail,
} from "@/lib/auth/supabase-admin";
import { sendVerificationEmail } from "@/lib/email";

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

  const result = await resendVerification(
    { email: input.email ?? "" },
    {
      findUserByEmail: findAuthUserByEmail,
      generateVerificationLink: adminGenerateVerificationLink,
      sendVerificationEmail,
      rateLimiter: globalRateLimiter,
      normalizeEmail,
    },
  );

  return jsonAuthResult(result);
}
