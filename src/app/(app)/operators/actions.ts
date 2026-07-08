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
} from "@/lib/operators/plant-id";
import {
  createOperatorRecord,
  type CreateOperatorRecordContext,
} from "@/lib/operators/create-record";

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
  const { org, userId } = await requireSession();
  const supabase = await createClient();
  const ctx: CreateOperatorRecordContext = { org, userId };

  const operatorId = await createOperatorRecord(supabase, ctx, formData);

  revalidatePath("/operators");
  redirect(`/operators/${operatorId}/qualify`);
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
