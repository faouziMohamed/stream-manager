"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Check,
  Copy,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  useCreateSummaryLink,
  useDeleteSummaryLink,
  useSummaryLinks,
  useToggleSummaryLink,
} from "@/lib/hooks/queries/use-settings.queries";
import type { SummaryLinkDto } from "@/lib/graphql/operations/settings.operations";
import { toDateTimeString } from "@/lib/utils/date-utils";

const linkSchema = z.object({
  label: z.string().optional(),
  showSensitiveInfo: z.boolean(),
  expiresAt: z.string().optional(),
});
type LinkForm = z.infer<typeof linkSchema>;

export function SummaryLinksManager() {
  const { data: links = [] } = useSummaryLinks();
  const createLink = useCreateSummaryLink();
  const deleteLink = useDeleteSummaryLink();
  const toggleLink = useToggleSummaryLink();

  const [linkDialog, setLinkDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const linkForm = useForm<LinkForm>({
    resolver: zodResolver(linkSchema),
    defaultValues: { showSensitiveInfo: false },
  });

  const onCreateLink = async (data: LinkForm) => {
    await createLink.mutateAsync({
      label: data.label || undefined,
      showSensitiveInfo: data.showSensitiveInfo,
      expiresAt: data.expiresAt ? toDateTimeString(data.expiresAt) : undefined,
    });
    setLinkDialog(false);
    linkForm.reset();
  };

  const copyToClipboard = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Liens de partage</CardTitle>
            <CardDescription>
              Générez des liens pour partager un résumé en lecture seule avec
              vos comptables.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => {
              linkForm.reset({ showSensitiveInfo: false });
              setLinkDialog(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Créer
          </Button>
        </CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun lien de partage.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Infos sensibles</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link: SummaryLinkDto) => (
                  <TableRow key={link.id}>
                    <TableCell className="font-medium">
                      {link.label ?? "Sans titre"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          link.showSensitiveInfo ? "destructive" : "secondary"
                        }
                      >
                        {link.showSensitiveInfo ? "Oui" : "Non"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={link.isActive ? "default" : "secondary"}>
                        {link.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {link.expiresAt
                        ? new Date(link.expiresAt).toLocaleDateString("fr-FR")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() =>
                            copyToClipboard(link.shareUrl, link.id)
                          }
                          title="Copier le lien"
                        >
                          {copied === link.id ? (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() =>
                            toggleLink.mutateAsync({
                              id: link.id,
                              isActive: !link.isActive,
                            })
                          }
                          title={link.isActive ? "Désactiver" : "Activer"}
                        >
                          {link.isActive ? (
                            <ToggleRight className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <ToggleLeft className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteTarget(link.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create link dialog */}
      <Dialog open={linkDialog} onOpenChange={setLinkDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nouveau lien de partage</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={linkForm.handleSubmit(onCreateLink)}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Libellé (optionnel)</Label>
              <Input
                placeholder="ex: Comptable janvier"
                {...linkForm.register("label")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Expiration (optionnel)</Label>
              <DateTimePicker
                value={linkForm.watch("expiresAt") || undefined}
                onChange={(v) => linkForm.setValue("expiresAt", v ?? "")}
                placeholder="Pas d'expiration"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showSensitive"
                {...linkForm.register("showSensitiveInfo")}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="showSensitive" className="cursor-pointer text-sm">
                Afficher les informations sensibles (montants, noms clients)
              </Label>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLinkDialog(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={createLink.isPending}>
                {createLink.isPending ? "Création…" : "Créer le lien"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Supprimer le lien"
        description="Ce lien de partage sera immédiatement invalidé."
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteLink.mutateAsync(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        loading={deleteLink.isPending}
      />
    </>
  );
}
