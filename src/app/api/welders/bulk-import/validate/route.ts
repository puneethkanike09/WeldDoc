import { createClient } from "@/lib/supabase/server";
import { extractImportUpload } from "@/lib/welders/bulk-import/extract-upload";
import {
  emptyValidateUploadResult,
  validateWelderImportUpload,
} from "@/lib/welders/bulk-import/validate-upload";

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
  const extracted = await extractImportUpload(formData);

  if (extracted.fileError) {
    return Response.json(emptyValidateUploadResult(extracted.fileError));
  }

  const result = await validateWelderImportUpload(
    extracted.excel,
    profile.org_id,
    supabase,
    extracted.photos,
    // Phase 2 docs temporarily disabled:
    // extracted.certificates,
    // extracted.continuity,
  );

  return Response.json(result);
}
