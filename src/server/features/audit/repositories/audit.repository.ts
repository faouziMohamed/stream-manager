import { createLogger } from '@/server/config/logger.config';
import { auditEventsTable } from '@/server/lib/db/tables/audit.table';
import { db } from '@/server/lib/db/client';
import { createResourceId } from '@/server/common/utils/resource-id';

const log = createLogger('audit');

export type AuditActor = {
  email?: string | null;
  id?: string | null;
  role?: string | null;
};

export type AuditEventInput = {
  action: string;
  actor?: AuditActor | null;
  entityId?: string | null;
  entityType?: string | null;
  metadata?: unknown;
};

/**
 * Appends one event to the audit trail.
 *
 * Best-effort on purpose: an audit insert failing must never undo or fail the
 * action the operator actually asked for. The failure is logged with enough
 * detail to repair the trail, and the request still succeeds.
 */
export async function recordAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    await db.insert(auditEventsTable).values({
      action: input.action,
      actorEmail: input.actor?.email ?? null,
      actorId: input.actor?.id ?? null,
      actorRole: input.actor?.role ?? null,
      entityId: input.entityId ?? null,
      entityType: input.entityType ?? null,
      id: createResourceId('aud'),
      metadata: (input.metadata ?? null) as never,
    });
  } catch (error) {
    log.warn(
      {
        action: input.action,
        error: error instanceof Error ? error.message : String(error),
      },
      'Audit event could not be written'
    );
  }
}
