import type { SupabaseClient } from "@supabase/supabase-js";
import { uploadFile } from "@/lib/storage";
import { validateWelderRegistration } from "@/lib/iso9606/qualification-fields";
import {
  assertPlantWelderIdAvailable,
  isUniqueViolation,
  normalizePlantWelderId,
  nextAvailablePlantWelderId,
} from "@/lib/welders/plant-id";
import { countOrgWelders } from "@/lib/billing/counts";
import { checkWelderLimit, welderLimitMessage } from "@/lib/billing/limits";
import { BillingError } from "@/lib/billing/errors";
import type { Organization } from "@/types/db";

function str(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}

export interface CreateWelderRecordContext {
  org: Pick<
    Organization,
    | "id"
    | "name"
    | "location_code"
    | "welder_seq"
    | "plan_tier"
    | "razorpay_plan_id"
    | "billing_exempt"
  >;
  userId: string | null;
}

/** Create a welder registry row from registration FormData (no redirect). */
export async function createWelderRecord(
  supabase: SupabaseClient,
  ctx: CreateWelderRecordContext,
  formData: FormData,
): Promise<string> {
  validateWelderRegistration(formData, "create");

  // Plan limit: welders are capped separately from operators. Counting on each
  // create also naturally enforces the cap across a group-session loop.
  const currentWelders = await countOrgWelders(supabase, ctx.org.id);
  const limit = checkWelderLimit(ctx.org, currentWelders);
  if (!limit.allowed) {
    throw new BillingError("welder_limit", welderLimitMessage(limit));
  }

  const fullName = str(formData.get("full_name"));
  if (!fullName) throw new Error("Welder name is required.");

  let plantWelderId = normalizePlantWelderId(str(formData.get("welder_id")));
  if (!plantWelderId) {
    plantWelderId = await nextAvailablePlantWelderId(
      supabase,
      ctx.org.id,
      ctx.org.welder_seq,
    );
  }
  if (!plantWelderId) throw new Error("Could not assign a plant welder ID.");

  const idMethodRaw = str(formData.get("id_method"));
  const idMethodOther = str(formData.get("id_method_other"));
  const idMethod =
    idMethodRaw === "Other" ? idMethodOther ?? "Other" : idMethodRaw;

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
