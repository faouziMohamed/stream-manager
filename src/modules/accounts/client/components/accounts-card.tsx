'use client';

import {
  ChevronDown,
  ChevronRight,
  Layers,
  LayersIcon,
  Pencil,
  Plus,
  Trash2,
  User,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/helpers';
import { statusColors, statusLabels } from '@/modules/accounts/client/components/accounts-types';
import { ProfileRow } from '@/modules/accounts/client/components/accounts-profile-row';
import type {
  StreamingAccountDto,
  StreamingProfileDto,
} from '@/lib/graphql/operations/accounts.operations';
import type { SubscriptionDto } from '@/lib/graphql/operations/subscriptions.operations';

interface AccountCardProps {
  account: StreamingAccountDto;
  subscriptions: SubscriptionDto[];
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  onEdit: (acc: StreamingAccountDto) => void;
  onDelete: (id: string) => void;
  onAddProfile: (accountId: string) => void;
  onEditProfile: (accountId: string, profile: StreamingProfileDto) => void;
  onDeleteProfile: (profileId: string) => void;
  onAssignProfile: (accountId: string, profile: StreamingProfileDto) => void;
  onAssignAccount: (acc: StreamingAccountDto) => void;
  onRemoveAssignment: (subscriptionId: string) => void;
}

export function AccountCard({
  account,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddProfile,
  onEditProfile,
  onDeleteProfile,
  onAssignProfile,
  onAssignAccount,
  onRemoveAssignment,
}: AccountCardProps) {
  const usedCount = account.usedProfiles;
  const isFull = account.supportsProfiles && usedCount >= account.maxProfiles;
  const identity = [account.email, account.phone].filter(Boolean).join(' · ') || '—';

  return (
    <Card className={cn(!account.isActive && 'opacity-60', 'card-hover')}>
      <CardHeader className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onToggleExpand(account.id)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            {expanded ? (
              <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">{account.label}</CardTitle>
                {account.service && (
                  <Badge variant="outline" className="text-xs">
                    {account.service.name}
                  </Badge>
                )}
                {account.supportsProfiles ? (
                  <Badge variant="outline" className="border-primary/30 text-primary gap-1 text-xs">
                    <Layers className="h-2.5 w-2.5" />
                    {usedCount}/{account.maxProfiles} profils
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground gap-1 text-xs">
                    <LayersIcon className="h-2.5 w-2.5" />
                    Sans profils
                  </Badge>
                )}
                {isFull && (
                  <Badge variant="destructive" className="text-xs">
                    Complet
                  </Badge>
                )}
                {!account.isActive && (
                  <Badge variant="secondary" className="text-xs">
                    Inactif
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">{identity}</p>
            </div>
          </button>

          {account.supportsProfiles && (
            <div className="hidden items-center gap-1.5 sm:flex">
              {Array.from({ length: account.maxProfiles }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border-2',
                    i < usedCount ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                  )}
                >
                  {i < usedCount && <User className="text-primary-foreground h-2.5 w-2.5" />}
                </div>
              ))}
            </div>
          )}

          <div className="flex shrink-0 gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(account)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive h-8 w-8"
              onClick={() => onDelete(account.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3 px-4 pt-0 pb-3">
          <div className="bg-muted/30 flex flex-wrap gap-x-4 gap-y-1 rounded-md px-3 py-2 text-sm">
            {account.email && (
              <span className="text-muted-foreground">
                Email : <span className="text-foreground font-mono">{account.email}</span>
              </span>
            )}
            {account.phone && (
              <span className="text-muted-foreground">
                Tél : <span className="text-foreground font-mono">{account.phone}</span>
              </span>
            )}
          </div>

          {account.supportsProfiles ? (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Profils
                </p>
                {account.profiles.length < account.maxProfiles && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                    onClick={() => onAddProfile(account.id)}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Ajouter
                  </Button>
                )}
              </div>
              {account.profiles.length === 0 ? (
                <p className="text-muted-foreground text-xs italic">Aucun profil défini.</p>
              ) : (
                <div className="space-y-1.5">
                  {account.profiles.map((profile) => (
                    <ProfileRow
                      key={profile.id}
                      accountId={account.id}
                      profile={profile}
                      onAssign={(p) => onAssignProfile(account.id, p)}
                      onEdit={(p) => onEditProfile(account.id, p)}
                      onDelete={onDeleteProfile}
                      onRemoveAssignment={onRemoveAssignment}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md border px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                  Utilisateur assigné
                </span>
                {(() => {
                  const acctAssign = account.accountAssignment;
                  const sub = acctAssign?.subscription;
                  if (sub) {
                    return (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn('text-xs', statusColors[sub.status])}
                        >
                          <UserCheck className="mr-1 h-3 w-3" />
                          {sub.client?.name ?? '—'}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {statusLabels[sub.status]} · jusqu&apos;au {sub.endDate}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive h-6 px-1.5 text-xs"
                          onClick={() => onRemoveAssignment(acctAssign!.subscriptionId)}
                        >
                          Libérer
                        </Button>
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs italic">
                        <UserX className="text-muted-foreground mr-1 inline h-3.5 w-3.5" />
                        Non assigné
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={() => onAssignAccount(account)}
                      >
                        Assigner un abonné
                      </Button>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {account.notes && <p className="text-muted-foreground text-xs italic">{account.notes}</p>}
        </CardContent>
      )}
    </Card>
  );
}
