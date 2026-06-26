import { createClient } from "@/lib/supabase/server";
import { validateWelderImportUpload } from "@/lib/welders/bulk-import/validate-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile?.org_id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const result = await validateWelderImportUpload(
    file instanceof File ? file : null,
    profile.org_id,
    supabase,
  );

  return Response.json(result);
}
