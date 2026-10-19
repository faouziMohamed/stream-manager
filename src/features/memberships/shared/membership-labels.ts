/**
 * The memberships workspace needs two different views of the same catalog.
 *
 * A picker offers only what an operator may choose now, so it is filtered to
 * active records. A table row labels whatever is already attached to it,
 * including an archived customer or a retired plan. Deriving both from one
 * active-only list is what made archived customers render as the placeholder
 * word "Customer" in the ledger, so the two are kept apart deliberately.
 */

export function activeOnly<TRecord extends { isActive: boolean }>(
  records: readonly TRecord[]
): TRecord[] {
  return records.filter((record) => record.isActive);
}

export function labelsById<TRecord extends { id: string; name: string }>(
  records: readonly TRecord[]
): Map<string, string> {
  return new Map(records.map((record) => [record.id, record.name]));
}
