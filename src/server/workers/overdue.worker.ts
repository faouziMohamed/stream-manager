import { createLogger } from '@/server/config/logger.config';
import { syncOverduePaymentsUseCase } from '@/server/features/payments/use-cases/sync-overdue-payments.use-case';

const logger = createLogger('worker-overdue');

export async function runOverdueWorker(
  dependencies: OverdueWorkerDependencies = defaultDependencies
) {
  try {
    const result = await dependencies.syncOverduePaymentsUseCase();
    dependencies.logInfo(
      { updatedCount: result.updatedCount },
      'Overdue payments synchronization completed'
    );
    return result;
  } catch (error) {
    dependencies.logError({ error }, 'Overdue payments synchronization failed');
    throw error;
  }
}

const defaultDependencies: OverdueWorkerDependencies = {
  logError: (payload, message) => logger.error(payload, message),
  logInfo: (payload, message) => logger.info(payload, message),
  syncOverduePaymentsUseCase,
};

interface OverdueWorkerDependencies {
  logError: (payload: object, message: string) => void;
  logInfo: (payload: object, message: string) => void;
  syncOverduePaymentsUseCase: typeof syncOverduePaymentsUseCase;
}
