'use client';

import { Copy, KeyRound, Loader2, Plus, Tag, Timer, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { ConfirmActionDialog } from '@/components/console/shared/confirm-action-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SummaryLinksPayload } from '@/features/summary/ui/queries/use-summary-links.queries';
import {
  useGenerateSummaryLink,
  useRevokeSummaryLink,
  useSummaryLinks,
} from '@/features/summary/ui/queries/use-summary-links.queries';
import { clientLogger } from '@/lib/logger/client-logger';
import { cn } from '@/lib/utils';

type SummaryLinkRow = SummaryLinksPayload['items'][number];

export function SummaryLinksConsole({ initialData }: { initialData: SummaryLinksPayload }) {
  const { data, isFetching } = useSummaryLinks(initialData);
  const generateMutation = useGenerateSummaryLink();
  const revokeMutation = useRevokeSummaryLink();

  const [label, setLabel] = useState('');
  const [expiry, setExpiry] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<SummaryLinkRow | null>(null);

  function handleGenerate() {
    const options = {
      label: label.trim() || undefined,
      expiresInDays: expiry ? Number(expiry) : undefined,
    };
    generateMutation.mutate(options, {
      onSuccess: () => {
        setLabel('');
        setExpiry('');
        setPopoverOpen(false);
      },
    });
  }

  return (
    <section className="mt-6 rounded-xl border border-(--sm-border) bg-(--sm-surface) p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-(--sm-muted)">
          <KeyRound className="size-3.5" />
          {data.items.length} shared snapshots · {isFetching ? 'Refreshing…' : 'Updated just now'}
        </div>

        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger render={<Button variant="accent" />}>
            <Plus className="size-4" />
            Generate link
          </PopoverTrigger>
          <PopoverContent
            className="w-72 border border-(--sm-border) bg-(--sm-surface) p-4"
            align="end"
          >
            <GenerateLinkForm
              label={label}
              expiry={expiry}
              pending={generateMutation.isPending}
              onLabelChange={setLabel}
              onExpiryChange={setExpiry}
              onGenerate={handleGenerate}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="mt-5 grid gap-3">
        {data.items.map((row) => {
          const pending = revokeMutation.isPending && revokeMutation.variables === row.id;
          const status = getSummaryLinkStatus(row.expiresAt);

          return (
            <article
              key={row.id}
              className="rounded-lg border border-(--sm-border) bg-(--sm-bg) px-4 py-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-(--sm-fg)">{row.token}</p>
                  <p className="text-xs text-(--sm-muted)">
                    {row.label ?? 'Unlabeled'} ·{' '}
                    {row.expiresAt
                      ? `expires ${new Date(row.expiresAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : 'never expires'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold',
                      status === 'Expired'
                        ? 'border-(--sm-border) bg-(--sm-surface2) text-(--sm-muted)'
                        : 'border-(--sm-coral-b) bg-(--sm-coral-s) text-(--sm-coral)'
                    )}
                  >
                    {status}
                  </span>
                  <Button variant="info" size="sm" onClick={() => void copyToken(row.token)}>
                    <Copy className="size-3.5" />
                    Copy
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={pending}
                    onClick={() => setRevokeTarget(row)}
                  >
                    <Trash2 className="size-3.5" />
                    Revoke
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
        {data.items.length === 0 ? (
          <article className="rounded-lg border border-dashed border-(--sm-border) bg-(--sm-bg) px-4 py-8 text-center">
            <p className="text-sm text-(--sm-muted)">
              No shared summary links have been generated.
            </p>
          </article>
        ) : null}
      </div>

      <ConfirmActionDialog
        cancelLabel="Keep link"
        confirmLabel="Revoke link"
        description={
          revokeTarget === null
            ? ''
            : `${revokeTarget.token}${revokeTarget.label === null ? '' : ` (${revokeTarget.label})`} will stop working immediately.`
        }
        icon={<Trash2 className="size-5" />}
        onConfirm={() => {
          if (revokeTarget === null) return;
          revokeMutation.mutate(revokeTarget.id);
          setRevokeTarget(null);
        }}
        onOpenChangeAction={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        open={revokeTarget !== null}
        pending={revokeMutation.isPending}
        title="Revoke this shared link?"
        tone="destructive"
      />
    </section>
  );
}

function GenerateLinkForm({
  label,
  expiry,
  pending,
  onLabelChange,
  onExpiryChange,
  onGenerate,
}: {
  label: string;
  expiry: string;
  pending: boolean;
  onLabelChange: (value: string) => void;
  onExpiryChange: (value: string) => void;
  onGenerate: () => void;
}) {
  return (
    <>
      <p className="mb-3 text-sm font-semibold text-(--sm-fg)">New summary link</p>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="link-label" className="text-xs">
            Label <span className="text-(--sm-muted)">(optional)</span>
          </Label>
          <Input
            icon={Tag}
            id="link-label"
            placeholder="e.g. Client review"
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">
            Expires in <span className="text-(--sm-muted)">(optional)</span>
          </Label>
          <Select value={expiry} onValueChange={(v) => onExpiryChange(v ?? '')}>
            <SelectTrigger icon={Timer} className="h-8 text-sm">
              <SelectValue placeholder="Never" />
            </SelectTrigger>
            <SelectContent>
              {EXPIRY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="accent" className="w-full" disabled={pending} onClick={onGenerate}>
          {pending ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Generating…
            </>
          ) : (
            'Generate'
          )}
        </Button>
      </div>
    </>
  );
}

const log = clientLogger('summary-links-console');

const EXPIRY_OPTIONS = [
  { label: 'Never', value: '' },
  { label: '1 day', value: '1' },
  { label: '3 days', value: '3' },
  { label: '7 days', value: '7' },
  { label: '30 days', value: '30' },
];

async function copyToken(token: string) {
  try {
    await navigator.clipboard.writeText(token);
  } catch {
    log.error('Unable to copy summary token');
  }
}

function getSummaryLinkStatus(expiresAt: string | null): 'Active' | 'Expired' {
  if (expiresAt === null) return 'Active';
  return new Date(expiresAt).getTime() > Date.now() ? 'Active' : 'Expired';
}
