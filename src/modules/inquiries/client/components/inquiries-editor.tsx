'use client';

import { useState } from 'react';
import { Archive, CheckCheck, Mail, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useInquiries, useMarkInquiryRead } from '@/lib/hooks/queries/use-notifications.queries';
import type { InquiryDto } from '@/lib/graphql/operations/settings.operations';
import { InquiryReplyDialog } from '@/modules/inquiries/client/components/inquiries-reply-dialog';
import { cn } from '@/lib/utils/helpers';
import { extractPlainTextFromRichText } from '@/components/rich-text/rich-text-utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  initialData?: InquiryDto[];
}

// ─── InquiryListItem ──────────────────────────────────────────────────────────

function InquiryListItem({
  inquiry,
  selected,
  onClick,
}: {
  inquiry: InquiryDto;
  selected: boolean;
  onClick: () => void;
}) {
  const isUnread = !inquiry.isRead;
  const isReplied = inquiry.replies.length > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full cursor-pointer border-b px-4 py-3 text-left transition-colors',
        'hover:bg-accent/50',
        selected && 'bg-accent',
        isUnread && !selected && 'bg-primary/5 border-l-2 border-l-primary'
      )}
    >
      <div className="flex items-start gap-2">
        <div className="mt-1.5 shrink-0">
          {isUnread ? (
            <span className="block h-2 w-2 rounded-full bg-primary animate-pulse" />
          ) : (
            <span className="block h-2 w-2 rounded-full bg-transparent" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className={cn('truncate text-sm', isUnread && 'font-semibold')}>
              {inquiry.name}
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-muted-foreground text-xs">
                {new Date(inquiry.createdAt).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                })}
              </span>
              {isReplied ? (
                <Badge className="border-emerald-200 bg-emerald-100 px-1.5 py-0 text-[10px] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border">
                  Répondu
                </Badge>
              ) : (
                <Badge className="border-red-200 bg-red-100 px-1.5 py-0 text-[10px] text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300 border">
                  En attente
                </Badge>
              )}
            </div>
          </div>
          <p className={cn('text-muted-foreground mt-0.5 truncate text-xs', isUnread && 'text-foreground/70')}>
            {extractPlainTextFromRichText(inquiry.message)}
          </p>
        </div>
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InquiriesEditor({ initialData }: Props) {
  const { data: inquiries = [] } = useInquiries(undefined, initialData);
  const markRead = useMarkInquiryRead();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const selected = inquiries.find((i) => i.id === selectedId) ?? null;
  const unreadCount = inquiries.filter((i) => !i.isRead).length;
  const filtered = unreadOnly ? inquiries.filter((i) => !i.isRead) : inquiries;

  const handleSelect = (inquiry: InquiryDto) => {
    setSelectedId(inquiry.id);
    if (!inquiry.isRead) {
      markRead.mutate({ id: inquiry.id, isRead: true });
    }
  };

  const markAllRead = () => {
    for (const i of inquiries.filter((i) => !i.isRead)) markRead.mutate({ id: i.id, isRead: true });
  };

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <MessageSquare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              Messages
              {unreadCount > 0 && (
                <Badge variant="destructive" className="animate-pulse text-xs">
                  {unreadCount}
                </Badge>
              )}
            </h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Messages reçus via le formulaire de contact
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={unreadOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUnreadOnly(!unreadOnly)}
            className="cursor-pointer"
          >
            <Mail className="mr-1.5 h-3.5 w-3.5" />
            Non lus {unreadOnly ? '(actif)' : ''}
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="cursor-pointer">
              <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
              Tout marquer lu
            </Button>
          )}
        </div>
      </div>

      {/* Main panel */}
      <Card className={cn('overflow-hidden', 'card-hover')}>
        <div className="flex h-[calc(100vh-220px)] min-h-[500px]">
          {/* Left: list */}
          <div
            className={cn(
              'flex w-full shrink-0 flex-col border-r md:w-80 lg:w-96',
              selected && 'hidden md:flex'
            )}
          >
            <div className="bg-muted/30 border-b px-4 py-2.5">
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {filtered.length} message{filtered.length === 1 ? '' : 's'}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3">
                  <Archive className="h-10 w-10 opacity-30" />
                  <p className="text-sm">{unreadOnly ? 'Aucun message non lu' : 'Aucun message'}</p>
                </div>
              ) : (
                filtered.map((inquiry) => (
                  <InquiryListItem
                    key={inquiry.id}
                    inquiry={inquiry}
                    selected={selectedId === inquiry.id}
                    onClick={() => handleSelect(inquiry)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right: thread */}
          <div className={cn('flex flex-1 flex-col', !selected && 'hidden md:flex')}>
            {selected ? (
              <InquiryReplyDialog
                key={selected.id}
                inquiry={selected}
                onBack={() => setSelectedId(null)}
              />
            ) : (
              <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3">
                <MessageSquare className="h-12 w-12 opacity-20" />
                <p className="text-sm">Sélectionnez un message pour le lire</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
