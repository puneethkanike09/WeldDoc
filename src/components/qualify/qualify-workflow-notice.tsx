"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

/** One-shot toast after NDT save redirect (?ndt=saved|failed). */
export function QualifyWorkflowNotice() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const shown = useRef(false);

  useEffect(() => {
    const ndt = searchParams.get("ndt");
    if (!ndt || shown.current) return;
    shown.current = true;

    if (ndt === "failed") {
      toast.error(
        "NDT results saved. One or more tests failed — certificate cannot be issued.",
      );
    } else if (ndt === "saved") {
      toast.success("NDT results saved.");
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("ndt");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, searchParams, router]);

  return null;
}
