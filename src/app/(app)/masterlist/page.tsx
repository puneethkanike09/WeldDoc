import { redirect } from "next/navigation";
import { getActiveStandardSlug } from "@/lib/standards/active-standard.server";

export default async function MasterListRedirectPage() {
  const slug = await getActiveStandardSlug();
  redirect(
    slug === "iso-14732" ? "/operators/masterlist" : "/welders/masterlist",
  );
}
