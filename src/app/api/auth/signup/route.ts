import { signup } from "@/lib/auth/signup";
import { jsonAuthResult } from "@/lib/auth/http";
import { globalRateLimiter } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/auth/types";
import {
  adminCreateUser,
  adminGenerateVerificationLink,
  getClientIp,
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

  const input = body as {
    fullName?: string;
    email?: string;
    password?: string;
  };

  const result = await signup(
    {
      fullName: input.fullName ?? "",
      email: input.email ?? "",
      password: input.password ?? "",
    },
    {
      createUser: adminCreateUser,
      generateVerificationLink: adminGenerateVerificationLink,
      sendVerificationEmail,
      rateLimiter: globalRateLimiter,
      normalizeEmail,
    },
    getClientIp(request.headers),
  );

  return jsonAuthResult(result);
}
