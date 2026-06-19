"use client";

import { useTransition } from "react";
import { Select } from "@/components/ui/input";
import { setWelderStatus } from "../actions";
import type { WelderStatus } from "@/types/db";
import { Loader2 } from "lucide-react";

export function StatusControl({
  welderId,
  status,
}: {
  welderId: string;
  status: WelderStatus;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-steel" />}
      <Select
        value={status}
        disabled={pending}
        onChange={(e) =>
          startTransition(() =>
            setWelderStatus(welderId, e.target.value as WelderStatus),
          )
        }
        className="h-9 w-36 text-[13px]"
      >
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
        <option value="Suspended">Suspended</option>
      </Select>
    </div>
  );
}
