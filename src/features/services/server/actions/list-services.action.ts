'use server';

import { loadServices } from '@/features/services/server/loaders/services.loader';
import { createLogger } from '@/lib/logger';

const log = createLogger('services.list.action');

export async function listServicesAction() {
  try {
    return await loadServices();
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to list services'
    );
    throw error;
  }
}
