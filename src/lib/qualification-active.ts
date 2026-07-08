/** Whether a qualification participates in registry views, ID cards, and alerts. */
export function isActiveQualification(q: {
  is_active?: boolean | null;
}): boolean {
  return q.is_active !== false;
}

export function activeQualifications<T extends { is_active?: boolean | null }>(
  items: T[],
): T[] {
  return items.filter(isActiveQualification);
}
