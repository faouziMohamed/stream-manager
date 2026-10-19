import { createLogger } from '@/server/config/logger.config';
import { cronJobs, isCronJobName } from '@/server/workers/registry';
import { env } from '@/lib/settings/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const log = createLogger('cron');

export async function GET(request: Request, context: { params: Promise<{ job: string }> }) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { job } = await context.params;

  if (!isCronJobName(job)) {
    return Response.json({ error: `Unknown job: ${job}` }, { status: 404 });
  }

  try {
    const result = await cronJobs[job]();
    log.info({ job }, 'Cron job finished');
    return Response.json({ job, ok: true, result: result ?? null });
  } catch (error) {
    log.error({ err: error, job }, 'Cron job failed');
    return Response.json({ error: 'Cron job failed', job }, { status: 500 });
  }
}

function isAuthorized(request: Request): boolean {
  if (env.CRON_SECRET === undefined) {
    // Without a configured secret the endpoint stays closed rather than open.
    return false;
  }

  return request.headers.get('authorization') === `Bearer ${env.CRON_SECRET}`;
}
