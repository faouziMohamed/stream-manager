'use client';

import { Archive, Edit3, Eye, Layers3, Plus, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConfirmActionDialog } from '@/components/console/shared/confirm-action-dialog';
import { Button } from '@/components/ui/button';
import { richTextToPlainText } from '@/components/shared/rich-text/rich-text-excerpt';
import { ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';
import type { ServiceFormValues } from '@/features/services/shared/service-form.schema';
import { ServiceDetailSheet } from '@/features/services/ui/components/service-detail-sheet';
import { ServiceForm } from '@/features/services/ui/components/service-form';
import type { ServicesListPayload } from '@/features/services/ui/queries/use-services.queries';
import {
  useArchiveService,
  useCreateService,
  useRestoreService,
  useServices,
  useUpdateService,
} from '@/features/services/ui/queries/use-services.queries';

export function ServicesConsole({ canManage, initialData }: ServicesConsoleProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editService, setEditService] = useState<ServiceRow>();
  const [viewService, setViewService] = useState<ServiceRow>();
  const [toggleTarget, setToggleTarget] = useState<ServiceRow>();
  const { data, isFetching } = useServices(initialData);
  const archiveMutation = useArchiveService();
  const createMutation = useCreateService();
  const restoreMutation = useRestoreService();
  const updateMutation = useUpdateService();

  function handleCreate(values: ServiceFormValues) {
    createMutation.mutate(values, {
      onSuccess: (service) => {
        setCreateOpen(false);
        toast.success('Service created', { description: service.name });
      },
    });
  }

  function handleUpdate(values: ServiceFormValues) {
    if (editService === undefined) return;
    updateMutation.mutate(
      { id: editService.id, values },
      {
        onSuccess: (service) => {
          setEditService(undefined);
          toast.success('Service updated', { description: service.name });
        },
      }
    );
  }
  return (
    <>
      {' '}
      <section className="mt-6 overflow-hidden rounded-xl border border-(--sm-border) bg-(--sm-surface)">
        <div className="flex flex-col gap-4 border-b border-(--sm-border) bg-(--sm-bg) p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold text-(--sm-fg)">Service catalog</p>
              <p className="mt-0.5 text-xs text-(--sm-muted)">
                {data.total} service{data.total === 1 ? '' : 's'} ·{' '}
                {isFetching ? 'Refreshing…' : 'Updated just now'}
              </p>
            </div>
          </div>
          {canManage ? (
            <Button variant="accent" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              New service
            </Button>
          ) : null}
        </div>

        <div className="grid gap-3 p-5">
          {data.items.map((row) => (
            <ServiceCard
              key={row.id}
              canManage={canManage}
              row={row}
              pending={isStateMutationPending(row.id, archiveMutation, restoreMutation)}
              onViewAction={() => setViewService(row)}
              onEditAction={() => setEditService(row)}
              onToggleAction={() => setToggleTarget(row)}
            />
          ))}

          {data.items.length === 0 ? (
            <article className="rounded-xl border border-dashed border-(--sm-border) bg-(--sm-bg) px-5 py-12 text-center">
              <Layers3 className="mx-auto size-7 text-(--sm-muted)" />
              <p className="mt-3 text-sm font-semibold text-(--sm-fg)">
                Build your service catalog
              </p>
              <p className="mt-1 text-xs text-(--sm-muted)">
                Create the first service before adding plans or streaming accounts.
              </p>
            </article>
          ) : null}
        </div>
      </section>
      <ServiceForm
        open={createOpen}
        isPending={createMutation.isPending}
        onOpenChangeAction={setCreateOpen}
        onSubmitAction={handleCreate}
      />
      <ServiceForm
        open={editService !== undefined}
        service={editService}
        isPending={updateMutation.isPending}
        onOpenChangeAction={(open) => {
          if (!open) setEditService(undefined);
        }}
        onSubmitAction={handleUpdate}
      />
      <ServiceDetailSheet
        service={viewService ?? null}
        open={viewService !== undefined}
        onOpenChangeAction={(open) => {
          if (!open) setViewService(undefined);
        }}
      />
      <ConfirmActionDialog
        confirmLabel={toggleTarget?.isActive === false ? 'Restore service' : 'Archive service'}
        description={serviceToggleDescription(toggleTarget)}
        icon={
          toggleTarget?.isActive === false ? (
            <RotateCcw className="size-5" />
          ) : (
            <Archive className="size-5" />
          )
        }
        onConfirm={() => {
          if (toggleTarget === undefined) return;
          const mutation = toggleTarget.isActive ? archiveMutation : restoreMutation;
          mutation.mutate(toggleTarget.id, {
            onSuccess: () =>
              toast.success(toggleTarget.isActive ? 'Service archived' : 'Service restored'),
          });
          setToggleTarget(undefined);
        }}
        onOpenChangeAction={(open) => {
          if (!open) setToggleTarget(undefined);
        }}
        open={toggleTarget !== undefined}
        pending={archiveMutation.isPending || restoreMutation.isPending}
        title={toggleTarget?.isActive === false ? 'Restore this service?' : 'Archive this service?'}
        tone={toggleTarget?.isActive === false ? 'accent' : 'caution'}
      />
    </>
  );
}

type ServicesConsoleProps = {
  /** Create, edit, archive and restore are admin mutations. */
  canManage: boolean;
  initialData: ServicesListPayload;
};

type ServiceRow = ServicesListPayload['items'][number];
type StateMutation = ReturnType<typeof useArchiveService>;

function serviceToggleDescription(target: ServiceRow | undefined): string {
  if (target === undefined) return '';
  if (target.isActive) {
    return `${target.name} will be hidden from pickers. Existing plans and records keep pointing at it.`;
  }
  return `${target.name} will be active again and selectable for new plans.`;
}

function ServiceLogo({ name, src }: { name: string; src: string | null | undefined }) {
  const [failed, setFailed] = useState(false);

  if (src === null || src === undefined || src === '' || failed) {
    return (
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-(--sm-border) bg-(--sm-surface2) text-(--sm-muted)">
        <Layers3 className="size-4" />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={name}
      className="size-10 shrink-0 rounded-lg border border-(--sm-border) object-cover"
      onError={() => setFailed(true)}
      src={src}
    />
  );
}

function ServiceCard({
  canManage,
  onEditAction,
  onToggleAction,
  onViewAction,
  pending,
  row,
}: {
  canManage: boolean;
  onEditAction: () => void;
  onToggleAction: () => void;
  onViewAction: () => void;
  pending: boolean;
  row: ServiceRow;
}) {
  const router = useRouter();
  const descriptionExcerpt = richTextToPlainText(row.descriptionContent);
  return (
    <article
      className="cursor-pointer rounded-xl border border-(--sm-border) bg-(--sm-bg) px-4 py-4 transition-colors hover:border-(--sm-coral-b)"
      onClick={onViewAction}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <ServiceLogo name={row.name} src={row.imageUrl} />
          <div>
            <div className="flex items-center gap-2">
              <Button
                className="h-auto justify-start p-0 text-sm font-semibold text-(--sm-fg) hover:underline"
                onClick={(event) => {
                  event.stopPropagation();
                  onViewAction();
                }}
                type="button"
                variant="link"
              >
                {row.name}
              </Button>
              <span className="rounded-full border border-(--sm-border) px-2 py-0.5 text-[10px] font-semibold tracking-wider text-(--sm-muted) uppercase">
                {row.category}
              </span>
            </div>
            <p className="mt-1 text-xs text-(--sm-muted)">
              {row.supportsProfiles
                ? 'Profile-level assignments enabled'
                : 'Account-level assignments'}
            </p>
            {descriptionExcerpt.length > 0 ? (
              <p className="mt-1 line-clamp-2 max-w-xl text-xs text-(--sm-muted)">
                {descriptionExcerpt}
              </p>
            ) : null}
          </div>
        </div>
        <div
          className="flex flex-wrap items-center gap-2"
          onClick={(event) => event.stopPropagation()}
        >
          <span
            className={cn(
              'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold',
              row.isActive
                ? 'border-(--sm-emerald)/45 bg-(--sm-emerald-s) text-(--sm-emerald)'
                : 'border-(--sm-border) bg-(--sm-surface2) text-(--sm-muted)'
            )}
          >
            {row.isActive ? 'Active' : 'Inactive'}
          </span>
          <Button
            onClick={() => router.push(ROUTES.console.serviceDetail(row.id))}
            size="sm"
            variant="info"
          >
            <Eye className="size-3.5" />
            View
          </Button>
          {canManage ? (
            <>
              <Button onClick={onEditAction} size="sm" variant="caution">
                <Edit3 className="size-3.5" />
                Edit service
              </Button>
              <Button
                disabled={pending}
                onClick={onToggleAction}
                size="sm"
                variant={row.isActive ? 'caution' : 'positive'}
              >
                {row.isActive ? (
                  <Archive className="size-3.5" />
                ) : (
                  <RotateCcw className="size-3.5" />
                )}
                {row.isActive ? 'Archive' : 'Restore'}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function isStateMutationPending(
  id: string,
  archiveMutation: StateMutation,
  restoreMutation: StateMutation
) {
  return (
    (archiveMutation.isPending && archiveMutation.variables === id) ||
    (restoreMutation.isPending && restoreMutation.variables === id)
  );
}
