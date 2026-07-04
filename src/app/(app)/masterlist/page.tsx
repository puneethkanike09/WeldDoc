import { redirect } from "next/navigation";

/** Legacy URL — welder and operator master lists have dedicated routes in the sidebar. */
export default async function MasterListRedirectPage() {
  redirect("/welders/masterlist");
}
