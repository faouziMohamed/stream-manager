"use client";

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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/helpers";
import { statusColors, statusLabels } from "./accounts-types";
import { ProfileRow } from "./accounts-profile-row";
import type {
  StreamingAccountDto,
  StreamingProfileDto,
} from "@/lib/graphql/operations/accounts.operations";
import type { SubscriptionDto } from "@/lib/graphql/operations/subscriptions.operations";

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
  const identity =
    [account.email, account.phone].filter(Boolean).join(" · ") || "—";

  return (
    <Card className={cn(!account.isActive && "opacity-60")}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => onToggleExpand(account.id)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">{account.label}</CardTitle>
                {account.service && (
                  <Badge variant="outline" className="text-xs">
                    {account.service.name}
                  </Badge>
                )}
                {account.supportsProfiles ? (
                  <Badge
                    variant="outline"
                    className="text-xs gap-1 border-primary/30 text-primary"
                  >
                    <Layers className="h-2.5 w-2.5" />
                    {usedCount}/{account.maxProfiles} profils
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs text-muted-foreground gap-1"
                  >
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
              <p className="text-xs text-muted-foreground mt-0.5">{identity}</p>
            </div>
          </button>

          {account.supportsProfiles && (
            <div className="hidden sm:flex items-center gap-1.5">
              {Array.from({ length: account.maxProfiles }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                    i < usedCount
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/30",
                  )}
                >
                  {i < usedCount && (
                    <User className="h-2.5 w-2.5 text-primary-foreground" />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => onEdit(account)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive"
              onClick={() => onDelete(account.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-3 px-4 space-y-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm bg-muted/30 rounded-md px-3 py-2">
            {account.email && (
              <span className="text-muted-foreground">
                Email :{" "}
                <span className="font-mono text-foreground">
                  {account.email}
                </span>
              </span>
            )}
            {account.phone && (
              <span className="text-muted-foreground">
                Tél :{" "}
                <span className="font-mono text-foreground">
                  {account.phone}
                </span>
              </span>
            )}
          </div>

          {account.supportsProfiles ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Profils
                </p>
                {account.profiles.length < account.maxProfiles && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs px-2"
                    onClick={() => onAddProfile(account.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Ajouter
                  </Button>
                )}
              </div>
              {account.profiles.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Aucun profil défini.
                </p>
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
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Utilisateur assigné
                </span>
                {(() => {
                  const acctAssign = account.accountAssignment;
                  const sub = acctAssign?.subscription;
                  if (sub) {
                    return (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn("text-xs", statusColors[sub.status])}
                        >
                          <UserCheck className="h-3 w-3 mr-1" />
                          {sub.client?.name ?? "—"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {statusLabels[sub.status]} · jusqu&apos;au{" "}
                          {sub.endDate}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs px-1.5 text-destructive"
                          onClick={() =>
                            onRemoveAssignment(acctAssign!.subscriptionId)
                          }
                        >
                          Libérer
                        </Button>
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground italic">
                        <UserX className="h-3.5 w-3.5 inline mr-1 text-muted-foreground" />
                        Non assigné
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 text-xs px-2"
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

          {account.notes && (
            <p className="text-xs text-muted-foreground italic">
              {account.notes}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
