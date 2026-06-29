export const REGISTRY_LIST_PAGE_SIZE = 10;

export function parseRegistryListPage(raw: string | undefined): number {
  const n = parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function registryListRange(page: number, totalCount: number) {
  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / REGISTRY_LIST_PAGE_SIZE),
  );
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * REGISTRY_LIST_PAGE_SIZE;
  const to = from + REGISTRY_LIST_PAGE_SIZE;
  return { safePage, totalPages, from, to };
}
