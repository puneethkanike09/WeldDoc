import type { SupabaseClient } from "@supabase/supabase-js";
import { canDiscardOq } from "@/lib/operator-status";
import { canDiscardWpq } from "@/lib/welder-status";
import { removeObjects } from "@/lib/storage";
import { loadSession, sessionHasApprovedMember } from "./index";
import type { QualificationSessionMember, WeldingStandard } from "@/types/db";

async function removeStoragePaths(paths: { bucket: string; path: string }[]) {
  const byBucket = new Map<string, string[]>();
  for (const { bucket, path } of paths) {
    if (!path) continue;
    const list = byBucket.get(bucket) ?? [];
    list.push(path);
    byBucket.set(bucket, list);
  }
  for (const [bucket, list] of byBucket) {
    await removeObjects(bucket, list);
  }
}

async function deleteDiscardableWelderQualification(
  supabase: SupabaseClient,
  orgId: string,
  qualificationId: string,
) {
  const { data: wpq } = await supabase
    .from("qualification_records")
    .select(
      "id, wpq_status, certificate_pdf_path, signed_certificate_pdf_path, legacy_document_paths",
    )
    .eq("id", qualificationId)
    .eq("org_id", orgId)
    .maybeSingle();

  if (!wpq) return;
  const q = wpq as {
    wpq_status: string;
    certificate_pdf_path: string | null;
    signed_certificate_pdf_path: string | null;
    legacy_document_paths: string[] | null;
  };

  if (!canDiscardWpq(q.wpq_status as never)) {
    throw new Error(
      "Cannot delete session — a linked qualification is no longer a draft.",
    );
  }

  const { data: ndtRows } = await supabase
    .from("ndt_dt_records")
    .select("report_pdf_path")
    .eq("wpq_id", qualificationId);

  const toRemove: { bucket: string; path: string }[] = [];
  if (q.certificate_pdf_path) {
    toRemove.push({ bucket: "generated-pdfs", path: q.certificate_pdf_path });
  }
  if (q.signed_certificate_pdf_path) {
    toRemove.push({
      bucket: "generated-pdfs",
      path: q.signed_certificate_pdf_path,
    });
  }
  for (const path of q.legacy_document_paths ?? []) {
    if (path) toRemove.push({ bucket: "legacy-docs", path });
  }
  for (const row of ndtRows ?? []) {
    if (row.report_pdf_path) {
      toRemove.push({ bucket: "ndt-reports", path: row.report_pdf_path });
    }
  }

  await removeStoragePaths(toRemove);

  const { error } = await supabase
    .from("qualification_records")
    .delete()
    .eq("id", qualificationId)
    .eq("org_id", orgId);

  if (error) throw new Error(error.message);
}

async function deleteDiscardableOperatorQualification(
  supabase: SupabaseClient,
  orgId: string,
  qualificationId: string,
) {
  const { data: oq } = await supabase
    .from("operator_qualifications")
    .select("id, oq_status, certificate_pdf_path, signed_certificate_pdf_path")
    .eq("id", qualificationId)
    .eq("org_id", orgId)
    .maybeSingle();

  if (!oq) return;
  const q = oq as {
    oq_status: string;
    certificate_pdf_path: string | null;
    signed_certificate_pdf_path: string | null;
  };

  if (!canDiscardOq(q.oq_status as never)) {
    throw new Error(
      "Cannot delete session — a linked qualification is no longer a draft.",
    );
  }

  const { data: ndtRows } = await supabase
    .from("operator_ndt_records")
    .select("report_pdf_path")
    .eq("oq_id", qualificationId);

  const toRemove: { bucket: string; path: string }[] = [];
  if (q.certificate_pdf_path) {
    toRemove.push({ bucket: "generated-pdfs", path: q.certificate_pdf_path });
  }
  if (q.signed_certificate_pdf_path) {
    toRemove.push({
      bucket: "generated-pdfs",
      path: q.signed_certificate_pdf_path,
    });
  }
  for (const row of ndtRows ?? []) {
    if (row.report_pdf_path) {
      toRemove.push({ bucket: "ndt-reports", path: row.report_pdf_path });
    }
  }

  await removeStoragePaths(toRemove);

  const { error } = await supabase
    .from("operator_qualifications")
    .delete()
    .eq("id", qualificationId)
    .eq("org_id", orgId);

  if (error) throw new Error(error.message);
}

async function deleteMemberQualifications(
  supabase: SupabaseClient,
  orgId: string,
  members: QualificationSessionMember[],
  standard: WeldingStandard,
) {
  for (const member of members) {
    if (!member.qualification_id) continue;
    if (standard === "ISO_9606_1") {
      await deleteDiscardableWelderQualification(
        supabase,
        orgId,
        member.qualification_id,
      );
    } else if (standard === "ISO_14732") {
      await deleteDiscardableOperatorQualification(
        supabase,
        orgId,
        member.qualification_id,
      );
    }
  }
}

export async function deleteGroupSession(
  supabase: SupabaseClient,
  orgId: string,
  sessionId: string,
  standard: WeldingStandard,
): Promise<void> {
  const loaded = await loadSession(supabase, orgId, sessionId, standard);
  if (!loaded) throw new Error("Session not found.");

  const { session, members } = loaded;

  if (sessionHasApprovedMember(members)) {
    throw new Error(
      "Cannot delete a session after certificates have been issued.",
    );
  }

  await deleteMemberQualifications(supabase, orgId, members, standard);

  const { error } = await supabase
    .from("qualification_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("org_id", orgId);

  if (error) throw new Error(error.message);
}
