import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. SERVER ONLY — never import into client components.
 * Bypasses RLS; used for the public auditor verification page, PDF generation,
 * and the cron alert job.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
