export const QUAL_LIST_PAGE_SIZE = 5;

export function parseQualListPage(raw: string | undefined): number {
  const n = parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function qualListRange(page: number, totalCount: number) {
  const totalPages = Math.max(1, Math.ceil(totalCount / QUAL_LIST_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * QUAL_LIST_PAGE_SIZE;
  const to = from + QUAL_LIST_PAGE_SIZE - 1;
  return { safePage, totalPages, from, to };
}
