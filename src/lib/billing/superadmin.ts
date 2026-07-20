import { redirect } from "next/navigation";
import { requireSession, type SessionContext } from "@/lib/auth";

/**
 * Superadmin identity via the SUPERADMIN_EMAILS env var (comma-separated).
 * Case-insensitive, whitespace-tolerant. No DB schema change required.
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const target = email.trim().toLowerCase();
  if (!target) return false;
  return (process.env.SUPERADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(target);
}

/**
 * Gate for the /admin dashboard. Redirects non-superadmins to /dashboard so the
 * route's existence isn't confirmed to ordinary users.
 */
export async function requireSuperAdmin(): Promise<SessionContext> {
  const session = await requireSession();
  if (!isSuperAdmin(session.email)) {
    redirect("/dashboard");
  }
  return session;
}
