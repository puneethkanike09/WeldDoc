"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import type { WelderStatus } from "@/types/db";
import { validateWelderRegistration } from "@/lib/iso9606/qualification-fields";

function str(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

export async function createWelder(formData: FormData) {
  validateWelderRegistration(formData, "create");
  const { org, userId } = await requireSession();
  const supabase = await createClient();

  const fullName = str(formData.get("full_name"));
  if (!fullName) throw new Error("Welder name is required.");

  const idMethodRaw = str(formData.get("id_method"));
  const idMethodOther = str(formData.get("id_method_other"));
  const idMethod =
    idMethodRaw === "Other" ? idMethodOther ?? "Other" : idMethodRaw;

  const { data: uid, error: uidErr } = await supabase.rpc("next_welder_uid", {
    p_org: org.id,
  });
  if (uidErr || !uid) throw new Error(uidErr?.message ?? "Could not allocate UID.");

  const photo = formData.get("photo");
  const photoPath = await uploadFile(
    "welder-photos",
    photo instanceof File ? photo : null,
    `${org.id}`,
  );

  const { data: welder, error } = await supabase
    .from("welders")
    .insert({
      org_id: org.id,
      uid,
      welder_id: str(formData.get("welder_id")),
      full_name: fullName,
      date_of_birth: str(formData.get("date_of_birth")),
      place_of_birth: str(formData.get("place_of_birth")),
      id_method: idMethod,
      id_number: str(formData.get("id_number")),
      employer: str(formData.get("employer")) ?? org.name,
      branch_location: str(formData.get("branch_location")) ?? org.location_code,
      photo_path: photoPath,
      status: "Active",
      is_new_welder: formData.get("is_new_welder") === "on",
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/welders");
  redirect(`/welders/${welder.id}`);
}

export async function updateWelder(welderId: string, formData: FormData) {
  validateWelderRegistration(formData, "edit");
  const { org } = await requireSession();
  const supabase = await createClient();

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
    welder_id: str(formData.get("welder_id")),
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
    .from("welders")
    .update(update)
    .eq("id", welderId)
    .eq("org_id", org.id);

  if (error) throw new Error(error.message);

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
