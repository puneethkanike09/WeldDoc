"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import type { WelderStatus } from "@/types/db";
import { validateWelderRegistration } from "@/lib/iso9606/qualification-fields";
import {
  assertPlantWelderIdAvailable,
  isUniqueViolation,
  normalizePlantWelderId,
} from "@/lib/welders/plant-id";
import { normalizeOptionalEmail } from "@/lib/utils";
import {
  createWelderRecord,
  type CreateWelderRecordContext,
} from "@/lib/welders/create-record";

function str(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

export async function createWelder(formData: FormData) {
  const { org, userId } = await requireSession();
  const supabase = await createClient();
  const ctx: CreateWelderRecordContext = { org, userId };

  const welderId = await createWelderRecord(supabase, ctx, formData);

  revalidatePath("/welders");
  redirect(`/welders/${welderId}/qualify?mode=new`);
}

export async function updateWelder(welderId: string, formData: FormData) {
  validateWelderRegistration(formData, "edit");
  const { org } = await requireSession();
  const supabase = await createClient();

  const plantWelderId = normalizePlantWelderId(str(formData.get("welder_id")));
  if (!plantWelderId) throw new Error("Plant welder ID is required.");

  await assertPlantWelderIdAvailable(supabase, org.id, plantWelderId, welderId);

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
    welder_id: plantWelderId,
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
    .from("welders")
    .update(update)
    .eq("id", welderId)
    .eq("org_id", org.id);

  if (error) {
    if (isUniqueViolation(error)) {
      throw new Error(
        `Plant welder ID "${plantWelderId}" is already in use. Choose a different ID.`,
      );
    }
    throw new Error(error.message);
  }

  revalidatePath(`/welders/${welderId}`);
  redirect(`/welders/${welderId}`);
}

export async function setWelderStatus(welderId: string, status: WelderStatus) {
  const { org } = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("welders")
    .update({ status })
    .eq("id", welderId)
    .eq("org_id", org.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/welders/${welderId}`);
  revalidatePath("/welders");
}
