import type { SupabaseClient } from "@supabase/supabase-js";
import { uploadFile } from "@/lib/storage";
import { validateWelderRegistration } from "@/lib/iso9606/qualification-fields";
import {
  assertPlantOperatorIdAvailable,
  isUniqueViolation,
  normalizePlantOperatorId,
  nextAvailablePlantOperatorId,
} from "@/lib/operators/plant-id";
import type { Organization } from "@/types/db";

function str(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

function syncRegistrationFields(formData: FormData) {
  const operatorId = str(formData.get("operator_id"));
  if (operatorId) formData.set("welder_id", operatorId);
}

export interface CreateOperatorRecordContext {
  org: Pick<Organization, "id" | "name" | "location_code" | "operator_seq">;
  userId: string | null;
}

/** Create an operator registry row from registration FormData (no redirect). */
export async function createOperatorRecord(
  supabase: SupabaseClient,
  ctx: CreateOperatorRecordContext,
  formData: FormData,
): Promise<string> {
  syncRegistrationFields(formData);
  validateWelderRegistration(formData, "create");

  const fullName = str(formData.get("full_name"));
  if (!fullName) throw new Error("Operator name is required.");

  const idMethodRaw = str(formData.get("id_method"));
  const idMethodOther = str(formData.get("id_method_other"));
  const idMethod =
    idMethodRaw === "Other" ? idMethodOther ?? "Other" : idMethodRaw;

  let plantOperatorId = normalizePlantOperatorId(str(formData.get("operator_id")));
  if (!plantOperatorId) {
    plantOperatorId = await nextAvailablePlantOperatorId(
      supabase,
      ctx.org.id,
      ctx.org.operator_seq,
    );
  }
  if (!plantOperatorId) throw new Error("Could not assign a plant operator ID.");

  await assertPlantOperatorIdAvailable(supabase, ctx.org.id, plantOperatorId);

  const photo = formData.get("photo");
  const photoPath = await uploadFile(
    "welder-photos",
    photo instanceof File && photo.size > 0 ? photo : null,
    `${ctx.org.id}`,
  );

  const { data: operator, error } = await supabase
    .from("operators")
    .insert({
      org_id: ctx.org.id,
      operator_id: plantOperatorId,
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
      is_new_operator: true,
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      throw new Error(
        `Plant operator ID "${plantOperatorId}" is already in use. Choose a different ID.`,
      );
    }
    throw new Error(error.message);
  }

  return operator.id;
}
