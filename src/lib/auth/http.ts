import { NextResponse } from "next/server";
import type { AuthResult } from "@/lib/auth/types";

export function jsonAuthResult<T = undefined>(
  result: AuthResult<T>,
  status?: number,
) {
  if (result.success) {
    return NextResponse.json(result, { status: status ?? 200 });
  }
  const map: Record<string, number> = {
    VALIDATION_ERROR: 400,
    EMAIL_ALREADY_EXISTS: 409,
    RATE_LIMITED: 429,
    EMAIL_SEND_FAILED: 502,
    NOT_FOUND: 404,
    INTERNAL_ERROR: 500,
  };
  return NextResponse.json(result, {
    status: status ?? map[result.code] ?? 400,
  });
}
