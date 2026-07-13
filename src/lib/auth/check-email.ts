import { z } from "zod";
import type { AuthResult } from "@/lib/auth/types";
import { normalizeEmail } from "@/lib/auth/types";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export interface CheckEmailDeps {
  emailExists: (email: string) => Promise<boolean>;
}

export async function checkEmail(
  input: { email: string },
  deps: CheckEmailDeps,
): Promise<AuthResult<{ exists: boolean }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      code: "VALIDATION_ERROR",
      message: parsed.error.issues[0]?.message ?? "Invalid email.",
    };
  }

  const email = normalizeEmail(parsed.data.email);
  const exists = await deps.emailExists(email);
  return { success: true, data: { exists } };
}
