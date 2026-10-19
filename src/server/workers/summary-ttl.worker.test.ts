import { runSummaryTtlWorker } from '@/server/workers/summary-ttl.worker';

const fixedNow = new Date('2026-06-17T01:00:00.000Z');

describe('runSummaryTtlWorker', () => {
  it('deletes expired links and logs the count', async () => {
    const logs: Array<{ message: string; payload: object }> = [];

    const result = await runSummaryTtlWorker({
      deleteExpiredSummaryLinks: async () => 3,
      getNow: () => fixedNow,
      logError: () => null,
      logInfo: (payload, message) => logs.push({ message, payload }),
    });

    expect(result.deletedCount).toBe(3);
    expect(logs).toEqual([
      { message: 'Summary link TTL cleanup completed', payload: { deletedCount: 3 } },
    ]);
  });

  it('returns zero when no links have expired', async () => {
    const result = await runSummaryTtlWorker({
      deleteExpiredSummaryLinks: async () => 0,
      getNow: () => fixedNow,
      logError: () => null,
      logInfo: () => null,
    });

    expect(result.deletedCount).toBe(0);
  });

  it('rethrows failures and logs errors', async () => {
    const errors: Array<{ message: string; payload: object }> = [];
    const failure = new Error('db-error');

    await expect(
      runSummaryTtlWorker({
        deleteExpiredSummaryLinks: async () => {
          throw failure;
        },
        getNow: () => fixedNow,
        logError: (payload, message) => errors.push({ message, payload }),
        logInfo: () => null,
      })
    ).rejects.toThrow('db-error');

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Summary link TTL cleanup failed');
  });

  it('passes current timestamp to deleteExpiredSummaryLinks', async () => {
    const received: Date[] = [];

    await runSummaryTtlWorker({
      deleteExpiredSummaryLinks: async (now) => {
        received.push(now);
        return 0;
      },
      getNow: () => fixedNow,
      logError: () => null,
      logInfo: () => null,
    });

    expect(received).toEqual([fixedNow]);
  });
});
