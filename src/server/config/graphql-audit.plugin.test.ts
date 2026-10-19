import { parse } from 'graphql';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAuditLogPlugin } from '@/server/config/graphql-audit.plugin';
import { recordAuditEvent } from '@/server/features/audit/repositories/audit.repository';

vi.mock('@/server/features/audit/repositories/audit.repository', () => ({
  recordAuditEvent: vi.fn(() => Promise.resolve()),
}));

const actor = { email: 'admin@example.com', id: 'usr_admin', role: 'admin' };

function runPlugin(options: {
  document: string;
  operationName?: string;
  result: unknown;
  variables?: Record<string, unknown>;
  user?: Record<string, unknown> | null;
}) {
  const plugin = createAuditLogPlugin();
  const done = plugin.onExecute?.({
    args: {
      contextValue: { user: options.user === undefined ? actor : options.user },
      document: parse(options.document),
      operationName: options.operationName,
      variableValues: options.variables ?? {},
    },
    // The remaining Yoga args are irrelevant to the plugin.
  } as never) as { onExecuteDone?: (input: { result: unknown }) => Promise<void> } | undefined;

  return done?.onExecuteDone?.({ result: options.result });
}

describe('createAuditLogPlugin', () => {
  beforeEach(() => {
    vi.mocked(recordAuditEvent).mockClear();
  });

  it('records a successful mutation with its actor, entity and redacted variables', async () => {
    await runPlugin({
      document:
        'mutation RenewMembership($input: RenewMembershipInput!) { renewMembership(input: $input) { id } }',
      operationName: 'RenewMembership',
      result: { data: { renewMembership: { id: 'mbr_new' } } },
      variables: { input: { id: 'mbr_1', markPaid: true, paidDate: '2026-10-01' } },
    });

    expect(recordAuditEvent).toHaveBeenCalledWith({
      action: 'RenewMembership',
      actor,
      entityId: 'mbr_1',
      entityType: 'membership',
      metadata: {
        variables: { input: { id: 'mbr_1', markPaid: true, paidDate: '2026-10-01' } },
      },
    });
  });

  it('writes nothing when the operation returned an error', async () => {
    await runPlugin({
      document:
        'mutation CancelMembership($input: CancelMembershipInput!) { cancelMembership(input: $input) { id } }',
      operationName: 'CancelMembership',
      result: { data: null, errors: [{ message: 'Forbidden' }] },
      variables: { input: { confirmed: true, id: 'mbr_1' } },
    });

    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it('ignores queries', () => {
    const plugin = createAuditLogPlugin();
    const done = plugin.onExecute?.({
      args: {
        contextValue: { user: actor },
        document: parse('query Memberships { memberships { items { id } } }'),
        operationName: 'Memberships',
        variableValues: {},
      },
    } as never);

    expect(done).toBeUndefined();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it('records an anonymous mutation without inventing an actor', async () => {
    await runPlugin({
      document: 'mutation { revokeSession(input: { id: "ses_1" }) { id } }',
      result: { data: { revokeSession: { id: 'ses_1' } } },
      user: null,
    });

    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'anonymous-mutation', actor: null })
    );
  });
});
