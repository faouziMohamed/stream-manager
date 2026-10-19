'use client';

import { Loader2, Monitor, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import { ConfirmActionDialog } from '@/components/console/shared/confirm-action-dialog';
import { Button } from '@/components/ui/button';
import { useRevokeSession, useSessions } from '@/features/sessions/ui/queries/use-sessions.queries';
import type { SessionItem } from '@/features/sessions/shared/session.types';

function describeDevice(session: SessionItem): string {
  const parts = [session.browser, session.os, session.deviceType].filter(
    (part): part is string => typeof part === 'string' && part.length > 0
  );
  return parts.length === 0 ? 'Unknown device' : parts.join(' · ');
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en');
}

export function SessionsConsole({ initialData }: { initialData?: SessionItem[] }) {
  const { data: sessions, isLoading } = useSessions(initialData);
  const revoke = useRevokeSession();
  const [revokeTarget, setRevokeTarget] = useState<SessionItem | null>(null);

  if (isLoading && sessions === undefined) {
    return (
      <div className="flex items-center gap-2 text-sm text-(--sm-muted)">
        <Loader2 className="size-4 animate-spin" /> Loading sessions…
      </div>
    );
  }

  const items = sessions ?? [];

  if (items.length === 0) {
    return <p className="text-sm text-(--sm-muted)">No active sessions.</p>;
  }

  return (
    <>
      <ul className="divide-y divide-(--sm-border) rounded-xl border border-(--sm-border) bg-(--sm-surface)">
        {items.map((session) => (
          <li key={session.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-3">
              <Monitor className="size-4 text-(--sm-muted)" />
              <div>
                <p className="text-sm font-medium text-(--sm-fg)">
                  {describeDevice(session)}
                  {session.current ? (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-(--sm-emerald)/10 px-2 py-0.5 text-xs text-(--sm-emerald)">
                      <ShieldCheck className="size-3" /> This device
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-(--sm-muted)">
                  {session.countryCode ? `${session.countryCode} · ` : ''}
                  Last used {formatDate(session.lastUsedAt)}
                </p>
              </div>
            </div>
            {session.current ? null : (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setRevokeTarget(session)}
                disabled={revoke.isPending}
              >
                {revoke.isPending ? 'Revoking…' : 'Revoke'}
              </Button>
            )}
          </li>
        ))}
      </ul>

      <ConfirmActionDialog
        cancelLabel="Keep session"
        confirmLabel="Revoke session"
        description={
          revokeTarget === null
            ? ''
            : `${describeDevice(revokeTarget)} will be signed out immediately and will need to log in again.`
        }
        icon={<Monitor className="size-5" />}
        onConfirm={() => {
          if (revokeTarget === null) return;
          revoke.mutate(revokeTarget.id);
          setRevokeTarget(null);
        }}
        onOpenChangeAction={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        open={revokeTarget !== null}
        pending={revoke.isPending}
        title="Revoke this session?"
        tone="destructive"
      />
    </>
  );
}
