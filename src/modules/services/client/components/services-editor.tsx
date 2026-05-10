'use client';

import { useCallback, useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { WorkflowHint } from '@/components/console/workflow-hint';
import { InfoCallout } from '@/components/console/info-callout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/console/confirm-dialog';
import {
  useCreateService,
  useDeletedServices,
  useDeleteService,
  useRestoreService,
  useServices,
  useUpdateService,
} from '@/lib/hooks/queries/use-services.queries';
import { ServiceDialog } from './services-editor-dialog';
import { ActiveServiceCard, DeletedServiceCard } from './services-editor-card';
import type { ServiceDto } from '@/lib/graphql/operations/services.operations';
import type { ServiceForm } from './services-editor-dialog';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialData?: ServiceDto[];
  defaultCurrency?: string;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ServicesEditor({ initialData, defaultCurrency = 'MAD' }: Props) {
  const { data: services = [] } = useServices(initialData);
  const { data: deletedServices = [] } = useDeletedServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const restoreService = useRestoreService();

  const [dialog, setDialog] = useState<{ open: boolean; service?: ServiceDto }>({ open: false });
  const [softDeleteTarget, setSoftDeleteTarget] = useState<ServiceDto | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<ServiceDto | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const onSubmit = useCallback(
    async (data: ServiceForm) => {
      const payload = {
        ...data,
        description: data.description || undefined,
        logoUrl: data.logoUrl || undefined,
      };
      await (dialog.service
        ? updateService.mutateAsync({
            id: dialog.service.id,
            input: payload,
          })
        : createService.mutateAsync(payload));
      setDialog({ open: false });
    },
    [dialog.service, createService, updateService]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground text-sm">
            Gérez vos services et leurs formules tarifaires
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true })} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau service
        </Button>
      </div>

      <WorkflowHint
        title="Guide de création de services"
        steps={[
          {
            label: 'Services',
            active: true,
            description: 'Créez et gérez vos offres de streaming',
          },
          { label: 'Formules', href: '#plans', description: 'Définissez les prix et durées' },
          {
            label: 'Abonnements',
            href: '/console/subscriptions',
            description: 'Associez les clients aux formules',
          },
          { label: 'Clients', href: '/console/clients', description: 'Gérez votre clientèle' },
          {
            label: 'Comptes',
            href: '/console/accounts',
            description: 'Configurez les accès streaming',
          },
        ]}
      />

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Actifs
            {services.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {services.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="deleted">
            Supprimés
            {deletedServices.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {deletedServices.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-2">
          {services.length === 0 ? (
            <InfoCallout variant="info" title="Bienvenue ! Commencez ici">
              Créez votre premier service (Netflix, Disney+, etc.). Ajoutez ensuite des formules
              tarifaires (durée, prix) depuis l&apos;onglet &quot;Formules&quot; une fois le service
              créé. Les abonnements lieront vos clients aux services.
            </InfoCallout>
          ) : (
            services.map((service) => (
              <ActiveServiceCard
                key={service.id}
                service={service}
                expanded={expandedId === service.id}
                defaultCurrency={defaultCurrency}
                onToggleExpand={(id) => setExpandedId(expandedId === id ? null : id)}
                onEdit={(s) => setDialog({ open: true, service: s })}
                onDelete={setSoftDeleteTarget}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="deleted" className="mt-4 space-y-2">
          {deletedServices.length === 0 ? (
            <Card>
              <CardContent className="text-muted-foreground py-12 text-center">
                Aucun service archivé.
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  La suppression définitive d&apos;un service effacera également toutes ses formules
                  et tous les abonnements associés. Cette action est irréversible.
                </span>
              </div>
              {deletedServices.map((service) => (
                <DeletedServiceCard
                  key={service.id}
                  service={service}
                  onRestore={(id) => restoreService.mutate(id)}
                  onHardDelete={setHardDeleteTarget}
                  restorePending={restoreService.isPending}
                />
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>

      <ServiceDialog
        open={dialog.open}
        service={dialog.service}
        onOpenChange={(o) => setDialog({ open: o })}
        onSubmit={onSubmit}
      />

      <ConfirmDialog
        open={!!softDeleteTarget}
        onOpenChange={(o) => !o && setSoftDeleteTarget(null)}
        title="Archiver le service"
        description={
          <span className="block space-y-2">
            <span className="block">
              Le service <strong>{softDeleteTarget?.name}</strong> sera archivé et n&apos;apparaîtra
              plus dans la liste principale ni sur le site public.
            </span>
            <span className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Les formules et abonnements existants sont conservés. Vous pourrez restaurer ce
                service depuis l&apos;onglet <em>Supprimés</em>.
              </span>
            </span>
          </span>
        }
        confirmLabel="Archiver"
        onConfirm={async () => {
          if (softDeleteTarget) {
            await deleteService.mutateAsync({ id: softDeleteTarget.id });
            setSoftDeleteTarget(null);
          }
        }}
        loading={deleteService.isPending}
      />

      <ConfirmDialog
        open={!!hardDeleteTarget}
        onOpenChange={(o) => !o && setHardDeleteTarget(null)}
        title="Suppression définitive"
        description={
          <span className="block space-y-2">
            <span className="block">
              Vous êtes sur le point de supprimer <strong>définitivement</strong> le service{' '}
              <strong>{hardDeleteTarget?.name}</strong>.
            </span>
            <span className="text-destructive flex items-start gap-1.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Toutes les formules et tous les abonnements liés à ce service seront également
                supprimés. Cette action est <strong>irréversible</strong>.
              </span>
            </span>
          </span>
        }
        confirmLabel="Supprimer définitivement"
        confirmVariant="destructive"
        onConfirm={async () => {
          if (hardDeleteTarget) {
            await deleteService.mutateAsync({
              id: hardDeleteTarget.id,
              force: true,
            });
            setHardDeleteTarget(null);
          }
        }}
        loading={deleteService.isPending}
      />
    </div>
  );
}
