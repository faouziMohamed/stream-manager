'use server';

import { loadPlans } from '@/features/plans/server/loaders/plans.loader';
import { createLogger } from '@/lib/logger';

const log = createLogger('plans.list.action');

export async function listPlansAction() {
  try {
    return await loadPlans();
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to list plans'
    );
    throw error;
  }
}
