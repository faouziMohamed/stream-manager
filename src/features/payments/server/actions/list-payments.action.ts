'use server';

import {
  loadPayments,
  loadPaymentsPage,
  type PaymentsPageInput,
} from '@/features/payments/server/loaders/payments.loader';
import { createLogger } from '@/lib/logger';

const log = createLogger('payments.list.action');

export async function listPaymentsAction() {
  try {
    return await loadPayments();
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to list payments'
    );
    throw error;
  }
}

export async function listPaymentsPageAction(input: PaymentsPageInput) {
  try {
    return await loadPaymentsPage(input);
  } catch (error) {
    log.error(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to load a payments page'
    );
    throw error;
  }
}
