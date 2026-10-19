import { runOverdueWorker } from '@/server/workers/overdue.worker';

describe('runOverdueWorker', () => {
  it('runs overdue sync and logs updated count', async () => {
    const infoLogs: Array<{ message: string; payload: object }> = [];

    const result = await runOverdueWorker({
      logError: () => null,
      logInfo: (payload, message) => {
        infoLogs.push({ message, payload });
      },
      syncOverduePaymentsUseCase: async () => ({ updatedCount: 7 }),
    });

    expect(result.updatedCount).toBe(7);
    expect(infoLogs).toEqual([
      {
        message: 'Overdue payments synchronization completed',
        payload: { updatedCount: 7 },
      },
    ]);
  });

  it('rethrows failures and logs errors', async () => {
    const errors: Array<{ message: string; payload: object }> = [];
    const failure = new Error('worker-failed');

    await expect(
      runOverdueWorker({
        logError: (payload, message) => {
          errors.push({ message, payload });
        },
        logInfo: () => null,
        syncOverduePaymentsUseCase: async () => {
          throw failure;
        },
      })
    ).rejects.toThrow('worker-failed');

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toBe('Overdue payments synchronization failed');
  });
});
