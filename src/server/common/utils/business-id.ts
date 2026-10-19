export function nextCustomerBusinessId(latestBusinessId?: string | null): string {
  const nextSequence = getNextSequence(latestBusinessId, /^CST-(\d{4})$/);

  return `CST-${formatSequence(nextSequence)}`;
}

export function nextMembershipBusinessId(year: number, latestBusinessId?: string | null): string {
  const nextSequence = getNextYearlySequence(year, latestBusinessId, /^MBR-(\d{4})-(\d{4})$/);

  return `MBR-${year}-${formatSequence(nextSequence)}`;
}

export function nextPaymentBusinessId(year: number, latestBusinessId?: string | null): string {
  const nextSequence = getNextYearlySequence(year, latestBusinessId, /^PAY-(\d{4})-(\d{4})$/);

  return `PAY-${year}-${formatSequence(nextSequence)}`;
}

export function nextChatBusinessId(latestBusinessId?: string | null): string {
  const nextSequence = getNextSequence(latestBusinessId, /^CHT-(\d{4})$/);

  return `CHT-${formatSequence(nextSequence)}`;
}

function formatSequence(sequence: number): string {
  return String(sequence).padStart(4, '0');
}

function getNextSequence(latestBusinessId: string | null | undefined, pattern: RegExp): number {
  if (latestBusinessId === undefined || latestBusinessId === null) {
    return 1;
  }

  const match = pattern.exec(latestBusinessId);

  if (match === null) {
    throw new Error(`Invalid business id format: ${latestBusinessId}`);
  }

  return Number(match[1]) + 1;
}

function getNextYearlySequence(
  year: number,
  latestBusinessId: string | null | undefined,
  pattern: RegExp
): number {
  if (latestBusinessId === undefined || latestBusinessId === null) {
    return 1;
  }

  const match = pattern.exec(latestBusinessId);

  if (match === null) {
    throw new Error(`Invalid business id format: ${latestBusinessId}`);
  }

  const latestYear = Number(match[1]);

  if (latestYear !== year) {
    return 1;
  }

  return Number(match[2]) + 1;
}
