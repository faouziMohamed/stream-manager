import { deleteExpiredSummaryLinks } from '@/server/features/settings/repositories/settings.repository';
import { createLogger } from '@/server/config/logger.config';

const logger = createLogger('worker-summary-ttl');

export async function runSummaryTtlWorker(
  dependencies: SummaryTtlWorkerDependencies = defaultDependencies
) {
  const now = dependencies.getNow();

  try {
    const deletedCount = await dependencies.deleteExpiredSummaryLinks(now);
    dependencies.logInfo({ deletedCount }, 'Summary link TTL cleanup completed');
    return { deletedCount };
  } catch (error) {
    dependencies.logError({ error }, 'Summary link TTL cleanup failed');
    throw error;
  }
}

const defaultDependencies: SummaryTtlWorkerDependencies = {
  deleteExpiredSummaryLinks,
  getNow: () => new Date(),
  logError: (payload, message) => logger.error(payload, message),
  logInfo: (payload, message) => logger.info(payload, message),
};

interface SummaryTtlWorkerDependencies {
  deleteExpiredSummaryLinks: (now: Date) => Promise<number>;
  getNow: () => Date;
  logError: (payload: object, message: string) => void;
  logInfo: (payload: object, message: string) => void;
}
