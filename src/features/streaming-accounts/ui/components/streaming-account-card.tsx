'use client';

import { ExternalLink, Link2, Pencil, Plus, Trash2, UserRound } from 'lucide-react';

import Link from 'next/link';

import { WithTooltip } from '@/components/console/shared/with-tooltip';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/config/routes';
import type { DeleteStreamingAccountTarget } from '@/features/streaming-accounts/ui/components/delete-streaming-account-dialog';
import { ProfilePill } from '@/features/streaming-accounts/ui/components/streaming-profile-pill';
import type { StreamingMembershipOption } from '@/features/streaming-accounts/ui/components/streaming-assignment-form';
import type { UnassignProfileTarget } from '@/features/streaming-accounts/ui/components/unassign-profile-dialog';
import type { StreamingAccountsPayload } from '@/features/streaming-accounts/ui/queries/use-streaming-accounts.queries';

export type StreamingAccountCardProps = {
  /** False for accountants: every control on this card is an admin mutation. */
  canManage: boolean;
  /** True when the card is already the whole page, so the title stops linking to itself. */
  isDetailView?: boolean;
  row: AccountRow;
  serviceNames: Map<string, string>;
  membershipsById: Map<string, StreamingMembershipOption>;
  onEditAction: (row: AccountRow) => void;
  onDeleteAction: (target: DeleteStreamingAccountTarget) => void;
  onAddProfileAction: (accountId: string) => void;
  onAssignAction: (row: AccountRow) => void;
  onUnassignAction: (target: UnassignProfileTarget) => void;
  onEditProfileAction: (profileId: string, name: string) => void;
  onDeleteProfileAction: (accountId: string, profileId: string) => void;
};

export function StreamingAccountCard({
  canManage,
  isDetailView = false,
  row,
  serviceNames,
  membershipsById,
  onEditAction,
  onDeleteAction,
  onAddProfileAction,
  onAssignAction,
  onUnassignAction,
  onEditProfileAction,
  onDeleteProfileAction,
}: StreamingAccountCardProps) {
  const profiles = row.profiles ?? [];
  const assignedCount = profiles.filter((p) => p.isAssigned).length;
  const profileCapacity = profiles.length > 0 ? profiles.length : row.maxProfiles;

  return (
    <article className="rounded-xl border border-(--sm-border) bg-(--sm-surface) p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        {/* The record page's own header already names the account and its
            service; repeating them here would be the same fact twice. */}
        <div className="min-w-0">
          {isDetailView ? null : (
            <>
              <Link
                className="truncate text-sm font-semibold text-(--sm-fg) hover:text-(--sm-coral)"
                href={ROUTES.console.streamingAccountDetail(row.id)}
              >
                {row.label}
              </Link>
              <p className="text-xs text-(--sm-muted)">
                {serviceNames.get(row.serviceId) ?? 'Service'} ·{' '}
                {row.supportsProfiles ? 'profiles on' : 'no profiles'}
              </p>
            </>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          {isDetailView ? null : (
            <WithTooltip label="Open this account's page">
              <Link
                aria-label={`Open ${row.label}`}
                className="inline-flex size-7 items-center justify-center rounded-md border border-(--sm-indigo-b) bg-(--sm-indigo-s) text-(--sm-indigo-t) hover:border-(--sm-indigo)/60"
                href={ROUTES.console.streamingAccountDetail(row.id)}
              >
                <ExternalLink className="size-3.5" />
              </Link>
            </WithTooltip>
          )}
          {canManage ? (
            <>
              <WithTooltip label="Edit account">
                <Button
                  aria-label="Edit account"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-(--sm-muted) hover:text-(--sm-fg)"
                  onClick={() => onEditAction(row)}
                >
                  <Pencil className="size-3.5" />
                </Button>
              </WithTooltip>
              <WithTooltip label="Delete account">
                <Button
                  aria-label="Delete account"
                  variant="ghost"
                  size="icon"
                  className="hover:text-destructive size-7 text-(--sm-muted)"
                  onClick={() =>
                    onDeleteAction({
                      id: row.id,
                      label: row.label,
                      profileCount: profiles.length,
                    })
                  }
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </WithTooltip>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {profiles.map((profile) => {
          const isLinked = profile.assignmentId !== null && profile.membershipId !== null;

          if (!isLinked) {
            return (
              <ProfilePill
                key={profile.id}
                name={profile.name}
                onDeleteAction={() => onDeleteProfileAction(row.id, profile.id)}
                onEditAction={(name) => onEditProfileAction(profile.id, name)}
                readOnly={!canManage}
              />
            );
          }

          const membership = membershipsById.get(profile.membershipId!);
          const assigneeName = membership?.customerName ?? 'Inactive membership';
          const planName = membership?.planName;
          const assigneeTitle =
            planName === undefined
              ? `Assigned to ${assigneeName}`
              : `Assigned to ${assigneeName} (${planName})`;

          return (
            <Button
              key={profile.id}
              type="button"
              variant="outline"
              size="sm"
              disabled={!canManage}
              title={
                canManage ? `${assigneeTitle} — click to unassign ${profile.name}` : assigneeTitle
              }
              className="group h-7 rounded-full border-(--sm-coral-b) bg-(--sm-coral-s) px-2.5 text-[10px] text-(--sm-coral-t) hover:bg-(--sm-coral-b) hover:text-(--sm-coral-t)"
              onClick={() =>
                onUnassignAction({
                  accountId: row.id,
                  assignmentId: profile.assignmentId!,
                  membershipId: profile.membershipId!,
                  profileId: profile.id,
                  profileName: profile.name,
                })
              }
            >
              <span className="font-semibold">{profile.name}</span>
              <UserRound className="size-2.5 opacity-70" />
              <span className="max-w-32 truncate opacity-80">{assigneeName}</span>
            </Button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isDetailView ? null : (
            <>
              <CapacityMeter assigned={assignedCount} capacity={profileCapacity} />
              <p className="text-xs text-(--sm-muted)">
                {assignedCount}/{profileCapacity} profiles assigned
              </p>
            </>
          )}
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => onAddProfileAction(row.id)}>
              <Plus className="size-3.5" />
              Add profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!profiles.some((p) => !p.isAssigned)}
              onClick={() => onAssignAction(row)}
            >
              <Link2 className="size-3.5" />
              Assign
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

type AccountRow = StreamingAccountsPayload['items'][number];

function CapacityMeter({ assigned, capacity }: { assigned: number; capacity: number }) {
  if (capacity <= 0) return null;

  const ratio = Math.min(assigned / capacity, 1);
  let barClass = 'bg-(--sm-emerald)';
  if (ratio >= 1) barClass = 'bg-(--sm-coral)';
  else if (ratio >= 0.8) barClass = 'bg-(--sm-gold)';

  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={capacity}
      aria-valuenow={assigned}
      aria-label="Assigned profile capacity"
      className="h-1.5 w-16 overflow-hidden rounded-full bg-(--sm-surface2)"
    >
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${barClass}`}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}
