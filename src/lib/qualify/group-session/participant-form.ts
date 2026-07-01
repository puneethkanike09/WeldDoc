/** Client-safe helpers for group participant form field names. */

export function sliceNewPersonFormData(
  formData: FormData,
  prefix: string,
  plantIdField: "welder_id" | "operator_id",
): FormData {
  const slice = new FormData();
  const fields = [
    "full_name",
    plantIdField,
    "date_of_birth",
    "place_of_birth",
    "id_method",
    "id_method_other",
    "id_number",
    "employer",
    "branch_location",
    "email",
    "photo",
    "country",
    "state",
    "district",
  ];
  for (const field of fields) {
    const key = `${prefix}_${field}`;
    const val = formData.get(key);
    if (val !== null) {
      if (field === plantIdField) {
        slice.set("welder_id", val);
        if (plantIdField === "operator_id") slice.set("operator_id", val);
      } else {
        slice.set(field, val);
      }
    }
  }
  return slice;
}

export function parseNewPersonPrefixes(formData: FormData): string[] {
  return formData
    .getAll("new_person_key")
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
}
