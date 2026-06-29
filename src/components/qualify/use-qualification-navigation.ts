"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { parseQualListPage } from "@/lib/qualify/profile-pagination";

export function useQualificationNavigation({
  qualParam,
  selectedId,
  page,
}: {
  qualParam: "oq" | "wpq";
  selectedId: string | null;
  page: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [optimisticQualId, setOptimisticQualId] = useState<string | null>(null);
  const [optimisticPage, setOptimisticPage] = useState<number | null>(null);

  const urlQualId = searchParams.get(qualParam);
  const urlPage = parseQualListPage(searchParams.get("page") ?? undefined);

  const activeQualId = optimisticQualId ?? urlQualId ?? selectedId;
  const activePage = optimisticPage ?? urlPage ?? page;

  useEffect(() => {
    if (optimisticQualId && optimisticQualId === selectedId) {
      setOptimisticQualId(null);
    }
  }, [optimisticQualId, selectedId]);

  useEffect(() => {
    if (optimisticPage !== null && optimisticPage === page) {
      setOptimisticPage(null);
    }
  }, [optimisticPage, page]);

  const listLoading = optimisticPage !== null && optimisticPage !== page;

  const detailLoading =
    !listLoading &&
    (optimisticQualId !== null && optimisticQualId !== selectedId);

  function navigate(href: string, next?: { qualId?: string; page?: number }) {
    if (
      next?.qualId !== undefined &&
      next.qualId === selectedId &&
      next.page === undefined
    ) {
      return;
    }
    if (next?.page !== undefined && next.page === page && !next.qualId) {
      return;
    }
    if (next?.qualId) setOptimisticQualId(next.qualId);
    if (next?.page !== undefined) setOptimisticPage(next.page);
    startTransition(() => router.push(href));
  }

  return {
    activeQualId,
    activePage,
    listLoading,
    detailLoading,
    navigate,
  };
}
