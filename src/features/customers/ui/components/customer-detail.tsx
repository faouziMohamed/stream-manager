'use client';

import { useState, type ReactNode } from 'react';
import { Archive, CalendarDays, Edit3, Mail, Phone, RotateCcw } from 'lucide-react';
import Link from 'next/link';

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
import { Button } from '@/components/ui/button';
import { CustomerForm } from '@/features/customers/ui/components/customer-form';
import { toForm } from '@/features/customers/shared/customer.mapper';
import {
  useArchiveCustomer,
  useUpdateCustomer,
} from '@/features/customers/ui/queries/use-customers.queries';
import type { CustomerDetailDto } from '@/features/customers/shared/customer.types';
import type { CustomerFormValues } from '@/features/customers/shared/customer.schema';
import { ROUTES } from '@/lib/config/routes';
import { StatusBadge } from '@/components/console/shared/status-badge';
import { cn } from '@/lib/utils';

export function CustomerDetail({ canManage, customer }: CustomerDetailProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [serverError, setServerError] = useState<string>();

  // The notes are stored as Tiptap JSON. Printing the document object showed
  // `{"type":"doc","content":[]}` to the operator; an empty document is "no
  // notes", not a JSON blob.
  const notesText = extractText(customer.notesContent);

  const updateMutation = useUpdateCustomer();
  const archiveMutation = useArchiveCustomer();

  function handleUpdate(values: CustomerFormValues) {
    setServerError(undefined);
    updateMutation.mutate(
      { id: customer.id, values },
      {
        onSuccess: () => setEditOpen(false),
        onError: (err) =>
          setServerError(err instanceof Error ? err.message : 'Failed to update customer'),
      }
    );
  }

  function handleArchive() {
    archiveMutation.mutate(customer.id, {
      onSettled: () => setArchiveOpen(false),
    });
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-(--sm-border) bg-(--sm-surface) p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-(--sm-fg)">Contact information</h2>
              {canManage ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                  className="border-(--sm-border2) text-(--sm-fg)"
                >
                  <Edit3 className="size-3.5" />
                  Edit
                </Button>
              ) : null}
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <InfoField icon={<Mail className="size-3.5" />} label="Email">
                {customer.email ?? <span className="text-(--sm-muted) italic">Not set</span>}
              </InfoField>
              <InfoField icon={<Phone className="size-3.5" />} label="Phone">
                {customer.phone ?? <span className="text-(--sm-muted) italic">Not set</span>}
              </InfoField>
              <InfoField icon={<CalendarDays className="size-3.5" />} label="Joined">
                {new Date(customer.createdAt).toLocaleDateString('en', { dateStyle: 'medium' })}
              </InfoField>
              <InfoField label="Status">
                <StatusBadge tone={customer.isActive ? 'positive' : 'neutral'}>
                  {customer.isActive ? 'Active' : 'Archived'}
                </StatusBadge>
              </InfoField>
            </dl>
          </section>

          {notesText === '' ? null : (
            <section className="rounded-xl border border-(--sm-border) bg-(--sm-surface) p-6">
              <h2 className="mb-3 text-sm font-semibold text-(--sm-fg)">Notes</h2>
              <p className="text-sm leading-6 whitespace-pre-wrap text-(--sm-muted)">{notesText}</p>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-(--sm-border) bg-(--sm-surface) p-5">
            <h2 className="mb-4 text-sm font-semibold text-(--sm-fg)">Quick actions</h2>
            <div className="flex flex-col gap-2">
              <Link
                href={`${ROUTES.console.memberships}?customerId=${customer.id}`}
                className={cn(
                  'inline-flex items-center justify-start gap-2 rounded-lg border border-(--sm-border2) px-3 py-2 text-sm font-medium text-(--sm-fg)',
                  'transition-colors hover:bg-(--sm-ghost-hover)'
                )}
              >
                View memberships
              </Link>
              {canManage ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start border-(--sm-border2) text-(--sm-fg)"
                  onClick={() => setArchiveOpen(true)}
                  disabled={archiveMutation.isPending}
                >
                  {customer.isActive ? (
                    <>
                      <Archive className="size-3.5" /> Archive customer
                    </>
                  ) : (
                    <>
                      <RotateCcw className="size-3.5" /> Restore customer
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </section>
        </aside>
      </div>

      <CustomerForm
        open={editOpen}
        onOpenChangeAction={setEditOpen}
        customer={toForm(customer)}
        onSubmitAction={handleUpdate}
        isPending={updateMutation.isPending}
        serverError={serverError}
      />

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent className="border border-(--sm-border) bg-(--sm-surface)">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-(--sm-gold-s) text-(--sm-gold-t)">
              <Archive className="size-5" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-(--sm-fg)">Archive customer?</AlertDialogTitle>
            <AlertDialogDescription className="text-(--sm-muted)">
              <strong className="text-(--sm-fg)">{customer.name}</strong> will be deactivated.
              Existing memberships are not affected. You can restore this customer at any time.
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
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type CustomerDetailProps = {
  /** Edit, archive and restore are admin mutations. */
  canManage: boolean;
  customer: CustomerDetailDto;
};

function InfoField({
  children,
  icon,
  label,
}: {
  children: ReactNode;
  icon?: ReactNode;
  label: string;
}) {
  return (
    <div className="space-y-1">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-(--sm-muted)">
        {icon}
        {label}
      </dt>
      <dd className="text-sm text-(--sm-fg)">{children}</dd>
    </div>
  );
}

type TiptapNode = { content?: TiptapNode[]; text?: string; type?: string };

/** Plain text out of a Tiptap JSON document. */
function extractText(value: unknown): string {
  if (value === null || value === undefined) return '';

  const visit = (node: TiptapNode): string => {
    if (node.text !== undefined) return node.text;
    if (node.content === undefined) return '';
    const separator = node.type === 'paragraph' || node.type === 'heading' ? '\n' : '';

    return node.content.map((child) => visit(child)).join(separator);
  };

  return visit(value as TiptapNode).trim();
}
