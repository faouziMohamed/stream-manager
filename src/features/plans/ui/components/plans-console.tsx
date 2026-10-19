'use client';

import { AlertCircle, LayoutGrid } from 'lucide-react';

import { ConsoleEmptyState } from '@/components/console/shared/console-empty-state';
import { ConsoleMobileList } from '@/components/console/shared/console-mobile-list';
import { PlanCard } from '@/features/plans/ui/components/plan-card';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ConsoleMetric } from '@/components/console/shared/console-metric';
import { ConsoleRefreshButton } from '@/components/console/shared/console-refresh-button';
import { DeletePlanDialog } from '@/features/plans/ui/components/delete-plan-dialog';
import { PlanRow } from '@/features/plans/ui/components/plan-row';
import { PlanDetailSheet } from '@/features/plans/ui/components/plan-detail-sheet';
import { ConsoleHeadRow, ConsoleTh } from '@/components/console/shared/console-table';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { PlanForm } from '@/features/plans/ui/components/plan-form';
import type { PlanFormValues } from '@/features/plans/shared/plan-form.schema';
import {
  PLANS_QUERY_KEY,
  type PlansPayload,
  useCreatePlan,
  useDeletePlan,
  usePlans,
  useUpdatePlan,
} from '@/features/plans/ui/queries/use-plans.queries';
import type { ListPlansQuery } from '@/lib/graphql/generated/graphql';

export function PlansConsole({ canManage, initialData, serviceOptions }: PlansConsoleProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PlanListItem | undefined>();
  const [viewTarget, setViewTarget] = useState<PlanListItem | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<PlanListItem | undefined>();

  const { data, isFetching } = usePlans(initialData);
  const createMutation = useCreatePlan();
  const updateMutation = useUpdatePlan();
  const deleteMutation = useDeletePlan();

  const serviceNames = new Map(serviceOptions.map((s) => [s.id, s.name]));

  const activeCount = data.items.filter((p) => p.isActive).length;
  const inactiveCount = data.items.length - activeCount;

  function handleCreate(values: PlanFormValues) {
    createMutation.mutate(values, {
      onSuccess: (plan) => {
        setCreateOpen(false);
        toast.success('Plan created', { description: plan.name });
      },
    });
  }

  function handleUpdate(values: PlanFormValues) {
    if (editTarget === undefined) return;
    updateMutation.mutate(
      { id: editTarget.id, values },
      {
        onSuccess: (plan) => {
          setEditTarget(undefined);
          toast.success('Plan updated', { description: plan.name });
        },
      }
    );
  }

  function handleDeleteConfirm() {
    if (deleteTarget === undefined) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: (plan) => {
        setDeleteTarget(undefined);
        toast.success('Plan deleted', { description: plan.name });
      },
      onError: (error) => {
        setDeleteTarget(undefined);
        toast.error('Failed to delete plan', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      },
    });
  }

  const hasPrerequisites = serviceOptions.length > 0;
  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <ConsoleMetric label="Total plans" value={String(data.total)} />
        <ConsoleMetric label="Active" tone="positive" value={String(activeCount)} />
        <ConsoleMetric label="Inactive" value={String(inactiveCount)} />
      </div>
      {!hasPrerequisites && (
        <div className="mt-3 flex items-start gap-3 rounded-xl border border-(--sm-gold-b) bg-(--sm-gold-s) px-4 py-3.5">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-(--sm-gold)" />
          <div>
            <p className="text-xs font-semibold text-(--sm-fg)">No services yet</p>
            <p className="mt-0.5 text-xs text-(--sm-muted)">
              Each plan must be linked to a streaming service. Create one first.
            </p>
          </div>
        </div>
      )}

      <section className="mt-6 overflow-hidden rounded-xl border border-(--sm-border) bg-(--sm-surface)">
        <div className="flex flex-col gap-4 border-b border-(--sm-border) bg-(--sm-bg) p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold text-(--sm-fg)">Pricing plans</p>
              <p className="mt-0.5 text-xs text-(--sm-muted)">
                {data.total} plan{data.total === 1 ? '' : 's'} ·{' '}
                {isFetching ? 'Refreshing…' : 'Updated just now'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ConsoleRefreshButton ariaLabel="Refresh plans" queryKey={PLANS_QUERY_KEY} />
            {canManage ? (
              <Button variant="accent" onClick={() => setCreateOpen(true)}>
                <LayoutGrid className="size-4" />
                New plan
              </Button>
            ) : null}
          </div>
        </div>

        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <ConsoleHeadRow>
                <ConsoleTh>Plan</ConsoleTh>
                <ConsoleTh>Type</ConsoleTh>
                <ConsoleTh>Linked to</ConsoleTh>
                <ConsoleTh>Duration</ConsoleTh>
                <ConsoleTh>Price</ConsoleTh>
                <ConsoleTh className="text-right">Actions</ConsoleTh>
              </ConsoleHeadRow>
            </TableHeader>
            <TableBody>
              {data.items.map((row) => (
                <PlanRow
                  key={row.id}
                  canManage={canManage}
                  row={row}
                  serviceNames={serviceNames}
                  onViewAction={() => setViewTarget(row)}
                  onEditAction={() => setEditTarget(row)}
                  onDeleteAction={() => setDeleteTarget(row)}
                />
              ))}

              {data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <ConsoleEmptyState
                      bordered={false}
                      title="No plans yet"
                      description="Create a pricing plan for a service to get started."
                    />
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        <ConsoleMobileList className="p-4">
          {data.items.map((row) => (
            <PlanCard
              key={row.id}
              canManage={canManage}
              onDeleteAction={() => setDeleteTarget(row)}
              onEditAction={() => setEditTarget(row)}
              onViewAction={() => setViewTarget(row)}
              row={row}
              serviceNames={serviceNames}
            />
          ))}
          {data.items.length === 0 ? (
            <ConsoleEmptyState
              title="No plans yet"
              description="Create a pricing plan for a service to get started."
            />
          ) : null}
        </ConsoleMobileList>
      </section>

      <PlanForm
        mode="create"
        open={createOpen}
        isPending={createMutation.isPending}
        onOpenChangeAction={setCreateOpen}
        onSubmitAction={handleCreate}
        serviceOptions={serviceOptions}
      />

      <PlanForm
        mode="edit"
        open={editTarget !== undefined}
        plan={editTarget}
        isPending={updateMutation.isPending}
        onOpenChangeAction={(open) => {
          if (!open) setEditTarget(undefined);
        }}
        onSubmitAction={handleUpdate}
        serviceOptions={serviceOptions}
      />

      <PlanDetailSheet
        plan={viewTarget ?? null}
        open={viewTarget !== undefined}
        onOpenChangeAction={(open) => {
          if (!open) setViewTarget(undefined);
        }}
      />

      <DeletePlanDialog
        plan={deleteTarget}
        isPending={deleteMutation.isPending}
        onConfirmAction={handleDeleteConfirm}
        onOpenChangeAction={(open) => {
          if (!open) setDeleteTarget(undefined);
        }}
      />
    </>
  );
}

type PlanListItem = ListPlansQuery['plans']['items'][number];

type ServiceOption = { id: string; name: string; category: string; isActive: boolean };

type PlansConsoleProps = {
  /** Create, edit and delete are admin mutations. */
  canManage: boolean;
  initialData: PlansPayload;
  serviceOptions: ServiceOption[];
};
