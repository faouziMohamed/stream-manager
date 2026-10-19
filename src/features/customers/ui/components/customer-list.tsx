'use client';

import { useState } from 'react';
import { Archive, Plus, UserRound } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ConsoleEmptyState } from '@/components/console/shared/console-empty-state';
import { ConsoleMobileList } from '@/components/console/shared/console-mobile-list';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CustomerCard } from '@/features/customers/ui/components/customer-card';
import { CustomerForm } from '@/features/customers/ui/components/customer-form';
import { CustomerRow } from '@/features/customers/ui/components/customer-row';
import { CustomerSummarySheet } from '@/features/customers/ui/components/customer-summary-sheet';
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useArchiveCustomer,
} from '@/features/customers/ui/queries/use-customers.queries';
import type {
  CustomerConnection,
  CustomerListItem,
} from '@/features/customers/shared/customer.types';
import type { CustomerFormValues } from '@/features/customers/shared/customer.schema';
import { toForm } from '@/features/customers/shared/customer.mapper';

export function CustomerList({ canManage, initialData }: CustomerListProps) {
  const { data, isLoading } = useCustomers(initialData);
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const archiveMutation = useArchiveCustomer();

  const [createOpen, setCreateOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<CustomerListItem>();
  const [archiveTarget, setArchiveTarget] = useState<CustomerListItem>();
  const [summaryTarget, setSummaryTarget] = useState<CustomerListItem | null>(null);
  const [serverError, setServerError] = useState<string>();

  function handleCreate(values: CustomerFormValues) {
    setServerError(undefined);
    createMutation.mutate(values, {
      onSuccess: () => setCreateOpen(false),
      onError: (err) =>
        setServerError(err instanceof Error ? err.message : 'Failed to create customer'),
    });
  }

  function handleUpdate(values: CustomerFormValues) {
    if (editCustomer === undefined) return;
    setServerError(undefined);
    updateMutation.mutate(
      { id: editCustomer.id, values },
      {
        onSuccess: () => setEditCustomer(undefined),
        onError: (err) =>
          setServerError(err instanceof Error ? err.message : 'Failed to update customer'),
      }
    );
  }

  function handleArchive() {
    if (archiveTarget === undefined) return;
    archiveMutation.mutate(archiveTarget.id, {
      onSettled: () => setArchiveTarget(undefined),
    });
  }

  const customers = data?.items ?? [];
  const total = data?.pageInfo.total ?? 0;

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-(--sm-muted)">
          {total} customer{total === 1 ? '' : 's'} total
        </p>
        {canManage ? (
          <Button
            onClick={() => {
              setServerError(undefined);
              setCreateOpen(true);
            }}
            variant="accent"
          >
            <Plus className="size-4" />
            New customer
          </Button>
        ) : null}
      </div>

      <div className="mt-4 hidden overflow-hidden rounded-xl border border-(--sm-border) bg-(--sm-surface) md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-(--sm-border) hover:bg-transparent">
              <TableHead className="px-4 py-3 text-xs font-semibold tracking-[0.16em] text-(--sm-muted) uppercase sm:px-6">
                Customer
              </TableHead>
              <TableHead className="hidden px-4 py-3 text-xs font-semibold tracking-[0.16em] text-(--sm-muted) uppercase sm:table-cell sm:px-6">
                Contact
              </TableHead>
              <TableHead className="px-4 py-3 text-xs font-semibold tracking-[0.16em] text-(--sm-muted) uppercase sm:px-6">
                Status
              </TableHead>
              <TableHead className="w-16 px-4 py-3 text-right text-xs font-semibold tracking-[0.16em] text-(--sm-muted) uppercase sm:px-6">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-(--sm-border)">
                    <TableCell className="px-4 py-4 sm:px-6">
                      <Skeleton className="h-4 w-36" />
                    </TableCell>
                    <TableCell className="hidden px-4 py-4 sm:table-cell sm:px-6">
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </TableCell>
                    <TableCell className="px-4 py-4 sm:px-6" />
                  </TableRow>
                ))
              : customers.map((customer) => (
                  <CustomerRow
                    key={customer.id}
                    canManage={canManage}
                    customer={customer}
                    onEdit={() => {
                      setServerError(undefined);
                      setEditCustomer(customer);
                    }}
                    onArchive={() => setArchiveTarget(customer)}
                    onOpenAction={() => setSummaryTarget(customer)}
                  />
                ))}

            {!isLoading && customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center">
                  <UserRound className="mx-auto mb-3 size-8 text-(--sm-muted)" />
                  <p className="text-sm text-(--sm-muted)">No customers yet</p>
                  <p className="mt-1 text-xs text-(--sm-muted)">
                    Create your first customer to get started.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConsoleMobileList className="mt-4">
        {customers.map((customer) => (
          <CustomerCard
            key={customer.id}
            canManage={canManage}
            customer={customer}
            onArchive={() => setArchiveTarget(customer)}
            onEdit={() => {
              setServerError(undefined);
              setEditCustomer(customer);
            }}
            onOpenAction={() => setSummaryTarget(customer)}
          />
        ))}
        {!isLoading && customers.length === 0 ? (
          <ConsoleEmptyState
            title="No customers yet"
            description="Create your first customer to get started."
          />
        ) : null}
      </ConsoleMobileList>

      <CustomerSummarySheet
        customer={summaryTarget}
        onOpenChangeAction={(open) => {
          if (!open) setSummaryTarget(null);
        }}
        open={summaryTarget !== null}
      />

      <CustomerForm
        open={createOpen}
        onOpenChangeAction={setCreateOpen}
        onSubmitAction={handleCreate}
        isPending={createMutation.isPending}
        serverError={serverError}
      />

      <CustomerForm
        open={editCustomer !== undefined}
        onOpenChangeAction={(open) => {
          if (!open) setEditCustomer(undefined);
        }}
        customer={editCustomer === undefined ? undefined : toForm(editCustomer)}
        onSubmitAction={handleUpdate}
        isPending={updateMutation.isPending}
        serverError={serverError}
      />

      <AlertDialog
        open={archiveTarget !== undefined}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(undefined);
        }}
      >
        <AlertDialogContent className="border border-(--sm-border) bg-(--sm-surface)">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-(--sm-gold-s) text-(--sm-gold-t)">
              <Archive className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-(--sm-fg)">Archive customer?</AlertDialogTitle>
            <AlertDialogDescription className="text-(--sm-muted)">
              <strong className="text-(--sm-fg)">{archiveTarget?.name}</strong> will be deactivated.
              Existing memberships will not be affected. This can be undone by re-activating the
              customer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-(--sm-border) bg-transparent text-(--sm-fg)">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={archiveMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {archiveMutation.isPending ? 'Archiving…' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type CustomerListProps = {
  /** Create, edit and archive are admin mutations. */
  canManage: boolean;
  initialData: CustomerConnection;
};
