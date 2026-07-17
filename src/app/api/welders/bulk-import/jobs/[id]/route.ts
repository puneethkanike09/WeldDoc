import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { org } = await requireSession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("import_jobs")
    .select(
      "id, status, progress, summary, error_message, created_at, started_at, finished_at",
    )
    .eq("id", id)
    .eq("org_id", org.id)
    .maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return Response.json({ error: "Job not found." }, { status: 404 });
  }

  return Response.json(data);
}
