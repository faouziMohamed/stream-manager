/**
 * One subscription, however many terms it took to get there.
 *
 * Renewing for six months writes six membership rows, each pointing at the one
 * it replaced through `renewedFromId`. Read literally that is six ledger lines
 * differing only by date; read as a chain it is one customer on one plan,
 * covered from the first start to the last end. Grouping happens here, on the
 * rows the page already loaded, so the query, the pagination and the counts
 * stay the database's version of the truth.
 */
export function buildMembershipChains<T extends MembershipTerm>(items: T[]): MembershipChain<T>[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const rootId = findRootId(item, byId);
    const group = groups.get(rootId);

    if (group === undefined) groups.set(rootId, [item]);
    else group.push(item);
  }

  return [...groups.values()]
    .map((group) => toChain(group))
    .toSorted((left, right) => right.coverageEnd.localeCompare(left.coverageEnd));
}

/**
 * The oldest term still present in `items`.
 *
 * A parent outside the page — pagination, or a customer filter — ends the walk
 * at the orphan, which then roots its own chain. A corrupt `a → b → a` pair
 * has no oldest term, so every member of the cycle agrees on the lowest id
 * instead; without that the answer would depend on which row we started from
 * and one loop would land in two rows. It cannot happen through the renewal
 * path, but a grouping pass is not where that should be discovered.
 */
function findRootId<T extends MembershipTerm>(item: T, byId: Map<string, T>): string {
  const visited = new Set<string>([item.id]);
  let current = item;

  for (;;) {
    const parentId = current.renewedFromId;

    if (parentId === null || parentId === undefined) return current.id;
    if (visited.has(parentId)) return [...visited].toSorted()[0] as string;

    const parent = byId.get(parentId);

    if (parent === undefined) return current.id;

    visited.add(parent.id);
    current = parent;
  }
}

/** Newest term first, because that is the one the row's actions mean. */
function toChain<T extends MembershipTerm>(group: T[]): MembershipChain<T> {
  const terms = group.toSorted((left, right) => right.startDate.localeCompare(left.startDate));
  const current = terms[0] as T;

  return {
    coverageEnd: terms.reduce((latest, term) => max(latest, term.endDate), current.endDate),
    coverageStart: terms.reduce(
      (earliest, term) => min(earliest, term.startDate),
      current.startDate
    ),
    current,
    id: current.id,
    termCount: terms.length,
    terms,
  };
}

function max(left: string, right: string): string {
  return right.localeCompare(left) > 0 ? right : left;
}

function min(left: string, right: string): string {
  return right.localeCompare(left) < 0 ? right : left;
}

export type MembershipTerm = {
  endDate: string;
  id: string;
  renewedFromId?: string | null;
  startDate: string;
};

export type MembershipChain<T extends MembershipTerm> = {
  /** The last day the chain covers. */
  coverageEnd: string;
  /** The first day the chain covers. */
  coverageStart: string;
  /** The newest term: what Cancel, Renew and the status badge act on. */
  current: T;
  /** `current.id` — stable while the chain is on screen. */
  id: string;
  termCount: number;
  /** Newest first. */
  terms: T[];
};
