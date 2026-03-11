"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/console/confirm-dialog";
import {
  useClients,
  useCreateClient,
  useDeleteClient,
  useUpdateClient,
} from "@/lib/hooks/queries/use-clients.queries";
import type { ClientDto } from "@/lib/graphql/operations/clients.operations";

const clientSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  email: z.email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type ClientForm = z.infer<typeof clientSchema>;

interface Props {
  initialData?: ClientDto[];
}

export function ClientsEditor({ initialData }: Props) {
  const { data: clients = [] } = useClients(initialData);
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [dialog, setDialog] = useState<{ open: boolean; client?: ClientDto }>({
    open: false,
  });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientForm>({ resolver: zodResolver(clientSchema) });

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search),
  );

  const openCreate = () => {
    reset({});
    setDialog({ open: true });
  };
  const openEdit = (c: ClientDto) => {
    reset({
      name: c.name,
      email: c.email ?? "",
      phone: c.phone ?? "",
      notes: c.notes ?? "",
    });
    setDialog({ open: true, client: c });
  };

  const onSubmit = async (data: ClientForm) => {
    const payload = {
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      notes: data.notes || undefined,
    };
    if (dialog.client) {
      await updateClient.mutateAsync({ id: dialog.client.id, input: payload });
    } else {
      await createClient.mutateAsync(payload);
    }
    setDialog({ open: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm">
            {clients.length} client{clients.length !== 1 ? "s" : ""} au total
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau client
        </Button>
      </div>

      <Input
        placeholder="Rechercher un client…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {search
              ? "Aucun résultat."
              : "Aucun client. Créez-en un pour commencer."}
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Abonnements actifs</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {client.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.phone ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        client.activeSubscriptionsCount > 0
                          ? "default"
                          : "secondary"
                      }
                    >
                      {client.activeSubscriptionsCount}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.isActive ? "outline" : "secondary"}>
                      {client.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEdit(client)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteTarget(client.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog({ open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog.client ? "Modifier le client" : "Nouveau client"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nom *</Label>
              <Input
                placeholder="Nom complet"
                {...register("name")}
                error={errors.name?.message}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@exemple.com"
                  {...register("email")}
                  error={errors.email?.message}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Téléphone</Label>
                <Input placeholder="+212 6XX XXX XXX" {...register("phone")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                placeholder="Notes internes…"
                rows={2}
                {...register("notes")}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialog({ open: false })}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement…" : "Enregistrer"}
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
