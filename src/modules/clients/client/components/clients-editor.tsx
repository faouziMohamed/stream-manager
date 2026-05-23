'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Pencil, Phone, Plus, Search, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormGroup } from '@/components/ui/form-group';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/console/confirm-dialog';
import {
  useClients,
  useCreateClient,
  useDeleteClient,
  useUpdateClient,
} from '@/lib/hooks/queries/use-clients.queries';
import type { ClientDto } from '@/lib/graphql/operations/clients.operations';
import { RichTextEditor } from '@/components/rich-text/rich-text-editor';
import { cn } from '@/lib/utils/helpers';

// ─── Avatar color palette ─────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-fuchsia-500', 'bg-teal-500',
];

function colorIndex(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = Math.trunc(Math.imul(31, h) + (name.codePointAt(i) ?? 0));
  return Math.abs(h) % AVATAR_COLORS.length;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const clientSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  email: z.email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.unknown().optional(),
});

type ClientForm = z.infer<typeof clientSchema>;

// ─── Client card ──────────────────────────────────────────────────────────────

function ClientCard({
  client,
  onEdit,
  onDelete,
}: {
  client: ClientDto;
  onEdit: (c: ClientDto) => void;
  onDelete: (id: string) => void;
}) {
  const avatarCls = AVATAR_COLORS[colorIndex(client.name)];
  const initials = getInitials(client.name);
  return (
    <Card
      className={cn(
        'card-hover group relative overflow-hidden transition-shadow',
        !client.isActive && 'opacity-60'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
              avatarCls
            )}
          >
            {initials}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold leading-tight">{client.name}</span>
              {!client.isActive && (
                <Badge variant="secondary" className="shrink-0 text-xs">Inactif</Badge>
              )}
            </div>
            {client.email && (
              <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate font-mono">{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                <Phone className="h-3 w-3 shrink-0" />
                <span className="font-mono">{client.phone}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(client)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive h-7 w-7"
              onClick={() => onDelete(client.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Footer chips */}
        <div className="mt-3 flex items-center gap-2">
          <Badge
            className={cn(
              'border text-xs',
              client.activeSubscriptionsCount > 0
                ? 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-400'
            )}
          >
            {client.activeSubscriptionsCount} abonnement{client.activeSubscriptionsCount === 1 ? '' : 's'} actif{client.activeSubscriptionsCount === 1 ? '' : 's'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main editor ──────────────────────────────────────────────────────────────

interface Props {
  initialData?: ClientDto[];
}

export function ClientsEditor({ initialData }: Props) {
  const { data: clients = [] } = useClients(initialData);
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [dialog, setDialog] = useState<{ open: boolean; client?: ClientDto }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientForm>({ resolver: zodResolver(clientSchema) });

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? '').includes(search)
  );

  const openCreate = () => {
    reset({ name: '', email: '', phone: '', notes: undefined });
    setDialog({ open: true });
  };
  const openEdit = (c: ClientDto) => {
    reset({ name: c.name, email: c.email ?? '', phone: c.phone ?? '', notes: c.notes ?? '' });
    setDialog({ open: true, client: c });
  };

  const onSubmit = async (data: ClientForm) => {
    const payload = {
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      notes: data.notes || undefined,
    };
    await (dialog.client
      ? updateClient.mutateAsync({ id: dialog.client.id, input: payload })
      : createClient.mutateAsync(payload));
    setDialog({ open: false });
  };

  const activeCount = clients.filter((c) => c.isActive).length;

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            {clients.length} client{clients.length === 1 ? '' : 's'} — {activeCount} actif{activeCount === 1 ? '' : 's'}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau client
        </Button>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Rechercher un client…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center">
            {search ? 'Aucun résultat.' : 'Aucun client. Créez-en un pour commencer.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onEdit={openEdit}
              onDelete={(id) => setDeleteTarget(id)}
            />
          ))}
        </div>
      )}

      {/* ── Create / Edit dialog ── */}
      <Dialog open={dialog.open} onOpenChange={(o) => setDialog({ open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.client ? 'Modifier le client' : 'Nouveau client'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormGroup label="Nom" required error={errors.name?.message}>
              <Input placeholder="Nom complet" {...register('name')} error={errors.name?.message} />
            </FormGroup>
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="Email" error={errors.email?.message}>
                <Input
                  type="email"
                  placeholder="email@exemple.com"
                  {...register('email')}
                  error={errors.email?.message}
                />
              </FormGroup>
              <FormGroup label="Téléphone">
                <Input placeholder="+212 6XX XXX XXX" {...register('phone')} />
              </FormGroup>
            </div>
            <FormGroup label="Notes">
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    preset="internal"
                    placeholder="Notes internes…"
                  />
                )}
              />
            </FormGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialog({ open: false })}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Supprimer le client"
        description="Ses abonnements et paiements associés seront également supprimés."
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteClient.mutateAsync(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        loading={deleteClient.isPending}
      />
    </div>
  );
}
