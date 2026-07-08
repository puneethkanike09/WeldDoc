import type { SupabaseClient } from "@supabase/supabase-js";
import { uploadFile } from "@/lib/storage";
import { validateWelderRegistration } from "@/lib/iso9606/qualification-fields";
import {
  assertPlantWelderIdAvailable,
  isUniqueViolation,
  normalizePlantWelderId,
  nextAvailablePlantWelderId,
} from "@/lib/welders/plant-id";
import type { Organization } from "@/types/db";

function str(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

export interface CreateWelderRecordContext {
  org: Pick<Organization, "id" | "name" | "location_code" | "welder_seq">;
  userId: string | null;
}

/** Create a welder registry row from registration FormData (no redirect). */
export async function createWelderRecord(
  supabase: SupabaseClient,
  ctx: CreateWelderRecordContext,
  formData: FormData,
): Promise<string> {
  validateWelderRegistration(formData, "create");

  const fullName = str(formData.get("full_name"));
  if (!fullName) throw new Error("Welder name is required.");

  const idMethodRaw = str(formData.get("id_method"));
  const idMethodOther = str(formData.get("id_method_other"));
  const idMethod =
    idMethodRaw === "Other" ? idMethodOther ?? "Other" : idMethodRaw;

  const { data: uid, error: uidErr } = await supabase.rpc("next_welder_uid", {
    p_org: ctx.org.id,
  });
  if (uidErr || !uid) throw new Error(uidErr?.message ?? "Could not allocate UID.");

  let plantWelderId = normalizePlantWelderId(str(formData.get("welder_id")));
  if (!plantWelderId) {
    plantWelderId = await nextAvailablePlantWelderId(
      supabase,
      ctx.org.id,
      ctx.org.welder_seq,
    );
  }
  if (!plantWelderId) throw new Error("Could not assign a plant welder ID.");

  await assertPlantWelderIdAvailable(supabase, ctx.org.id, plantWelderId);

  const photo = formData.get("photo");
  const photoPath = await uploadFile(
    "welder-photos",
    photo instanceof File && photo.size > 0 ? photo : null,
    `${ctx.org.id}`,
  );

  const { data: welder, error } = await supabase
    .from("welders")
    .insert({
      org_id: ctx.org.id,
      uid,
      welder_id: plantWelderId,
      full_name: fullName,
      date_of_birth: str(formData.get("date_of_birth")),
      place_of_birth: str(formData.get("place_of_birth")),
      id_method: idMethod,
      id_number: str(formData.get("id_number")),
      employer: str(formData.get("employer")) ?? ctx.org.name,
      branch_location:
        str(formData.get("branch_location")) ?? ctx.org.location_code,
      photo_path: photoPath,
      status: "Active",
      is_new_welder: true,
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      throw new Error(
        `Plant welder ID "${plantWelderId}" is already in use. Choose a different ID.`,
      );
    }
    throw new Error(error.message);
  }

  return welder.id;
}
