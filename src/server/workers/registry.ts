import {
  runMembershipExpiredWorker,
  runMembershipExpiringWorker,
} from '@/server/workers/expiry.worker';
import { runOverdueWorker } from '@/server/workers/overdue.worker';
import { runSummaryTtlWorker } from '@/server/workers/summary-ttl.worker';

// The jobs used to run in a separate node-cron process. They are now plain
// handlers invoked by GET /api/cron/<job>; the schedule lives in vercel.json
// (or any external scheduler that can send the CRON_SECRET).
export const cronJobs = {
  'memberships-expired': runMembershipExpiredWorker,
  'memberships-expiring': runMembershipExpiringWorker,
  'overdue-payments': runOverdueWorker,
  'summary-link-ttl': runSummaryTtlWorker,
} satisfies Record<string, () => Promise<unknown>>;

export type CronJobName = keyof typeof cronJobs;

export function isCronJobName(value: string): value is CronJobName {
  return Object.hasOwn(cronJobs, value);
}
