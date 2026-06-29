"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import type { WelderStatus } from "@/types/db";
import { validateWelderRegistration } from "@/lib/iso9606/qualification-fields";
import {
  assertPlantOperatorIdAvailable,
  isUniqueViolation,
  normalizePlantOperatorId,
  nextAvailablePlantOperatorId,
} from "@/lib/operators/plant-id";
import { normalizeOptionalEmail } from "@/lib/utils";

function str(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

/** Map operator_id to welder_id so shared ISO 9606 registration validation applies. */
function syncRegistrationFields(formData: FormData) {
  const operatorId = str(formData.get("operator_id"));
  if (operatorId) formData.set("welder_id", operatorId);
}

export async function createOperator(formData: FormData) {
  syncRegistrationFields(formData);
  validateWelderRegistration(formData, "create");
  const { org, userId } = await requireSession();
  const supabase = await createClient();

  const fullName = str(formData.get("full_name"));
  if (!fullName) throw new Error("Operator name is required.");

  const idMethodRaw = str(formData.get("id_method"));
  const idMethodOther = str(formData.get("id_method_other"));
  const idMethod =
    idMethodRaw === "Other" ? idMethodOther ?? "Other" : idMethodRaw;

  const { data: uid, error: uidErr } = await supabase.rpc("next_operator_uid", {
    p_org: org.id,
  });
  if (uidErr || !uid) throw new Error(uidErr?.message ?? "Could not allocate UID.");

  let plantOperatorId = normalizePlantOperatorId(str(formData.get("operator_id")));
  if (!plantOperatorId) {
    plantOperatorId = await nextAvailablePlantOperatorId(
      supabase,
      org.id,
      org.operator_seq,
    );
  }
  if (!plantOperatorId) {
    throw new Error("Could not assign a plant operator ID.");
  }

  await assertPlantOperatorIdAvailable(supabase, org.id, plantOperatorId);

  const photo = formData.get("photo");
  const photoPath = await uploadFile(
    "welder-photos",
    photo instanceof File ? photo : null,
    `${org.id}`,
  );

  const { data: operator, error } = await supabase
    .from("operators")
    .insert({
      org_id: org.id,
      uid,
      operator_id: plantOperatorId,
      full_name: fullName,
      date_of_birth: str(formData.get("date_of_birth")),
      place_of_birth: str(formData.get("place_of_birth")),
      id_method: idMethod,
      id_number: str(formData.get("id_number")),
      employer: str(formData.get("employer")) ?? org.name,
      branch_location: str(formData.get("branch_location")) ?? org.location_code,
      email: normalizeOptionalEmail(str(formData.get("email"))),
      photo_path: photoPath,
      status: "Active",
      is_new_operator: true,
      created_by: userId,
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

  revalidatePath("/operators");
  redirect(`/operators/${operator.id}/qualify`);
}

export async function updateOperator(operatorId: string, formData: FormData) {
  syncRegistrationFields(formData);
  validateWelderRegistration(formData, "edit");
  const { org } = await requireSession();
  const supabase = await createClient();

  const plantOperatorId = normalizePlantOperatorId(str(formData.get("operator_id")));
  if (!plantOperatorId) throw new Error("Plant operator ID is required.");

  await assertPlantOperatorIdAvailable(
    supabase,
    org.id,
    plantOperatorId,
    operatorId,
  );

  const photo = formData.get("photo");
  const photoPath = await uploadFile(
    "welder-photos",
    photo instanceof File ? photo : null,
    `${org.id}`,
  );

  const idMethodRaw = str(formData.get("id_method"));
  const idMethodOther = str(formData.get("id_method_other"));
  const idMethod =
    idMethodRaw === "Other" ? idMethodOther ?? "Other" : idMethodRaw;

  const update: Record<string, unknown> = {
    operator_id: plantOperatorId,
    full_name: str(formData.get("full_name")),
    date_of_birth: str(formData.get("date_of_birth")),
    place_of_birth: str(formData.get("place_of_birth")),
    id_method: idMethod,
    id_number: str(formData.get("id_number")),
    employer: str(formData.get("employer")),
    branch_location: str(formData.get("branch_location")),
    email: normalizeOptionalEmail(str(formData.get("email"))),
  };
  if (photoPath) update.photo_path = photoPath;

  const { error } = await supabase
    .from("operators")
    .update(update)
    .eq("id", operatorId)
    .eq("org_id", org.id);

  if (error) {
    if (isUniqueViolation(error)) {
      throw new Error(
        `Plant operator ID "${plantOperatorId}" is already in use. Choose a different ID.`,
      );
    }
    throw new Error(error.message);
  }

  revalidatePath(`/operators/${operatorId}`);
  redirect(`/operators/${operatorId}`);
}

export async function setOperatorStatus(
  operatorId: string,
  status: WelderStatus,
) {
  const { org } = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("operators")
    .update({ status })
    .eq("id", operatorId)
    .eq("org_id", org.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/operators/${operatorId}`);
  revalidatePath("/operators");
}
