import { checkEmail } from "@/lib/auth/check-email";
import { jsonAuthResult } from "@/lib/auth/http";
import { adminEmailExists } from "@/lib/auth/supabase-admin";

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
  const result = await checkEmail(
    { email: input.email ?? "" },
    { emailExists: adminEmailExists },
  );

  return jsonAuthResult(result);
}
