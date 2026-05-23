'use client';

import { Layers, MonitorPlay, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AccountsStats({
  count,
  totalSlots,
  usedSlots,
  totalAssigned,
}: {
  count: number;
  totalSlots: number;
  usedSlots: number;
  totalAssigned: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div className="bg-card rounded-xl border p-4">
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
          <MonitorPlay className="h-3.5 w-3.5" />
          Comptes
        </p>
        <p className="mt-1 text-2xl font-bold">{count}</p>
      </div>
      {totalSlots > 0 && (
        <div className="bg-card rounded-xl border p-4">
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
            <Layers className="h-3.5 w-3.5" />
            Profils
          </p>
          <p className="mt-1 text-2xl font-bold">
            {usedSlots}
            <span className="text-muted-foreground ml-1 text-sm font-normal">/ {totalSlots}</span>
          </p>
        </div>
      )}
      <div className="bg-card rounded-xl border p-4">
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
          <Users className="h-3.5 w-3.5" />
          Assignés
        </p>
        <p className="mt-1 text-2xl font-bold">{totalAssigned}</p>
      </div>
    </div>
  );
}

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-8 py-16 text-center">
      <div className="bg-primary/10 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
        <MonitorPlay className="text-primary h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold">Aucun compte streaming</h3>
      <p className="text-muted-foreground mx-auto mt-2 max-w-xs text-sm">
        Ajoutez vos premiers comptes réels (Netflix, Disney+…) pour les associer aux abonnements de
        vos clients.
      </p>
      <Button onClick={onAdd} className="mt-6 gap-2">
        <Plus className="h-4 w-4" />
        Créer un compte
      </Button>
    </div>
  );
}

export function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className="h-7 rounded-full px-3 text-xs"
    >
      {label}
    </Button>
  );
}


