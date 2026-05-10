'use client';

import { useState } from 'react';
import { Archive, CheckCheck, Circle, Mail, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useInquiries, useMarkInquiryRead } from '@/lib/hooks/queries/use-notifications.queries';
import type { InquiryDto } from '@/lib/graphql/operations/settings.operations';
import { InquiryReplyDialog } from '@/modules/inquiries/client/components/inquiries-reply-dialog';
import { cn } from '@/lib/utils/helpers';

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
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full cursor-pointer border-b px-4 py-3 text-left transition-colors',
        'hover:bg-accent/50',
        selected && 'bg-accent'
      )}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0">
          {inquiry.isRead ? (
            <Circle className="h-2 w-2 text-transparent" />
          ) : (
            <Circle className="fill-primary text-primary h-2 w-2" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className={cn('truncate text-sm', !inquiry.isRead && 'font-semibold')}>
              {inquiry.name}
            </span>
            <span className="text-muted-foreground shrink-0 text-xs">
              {new Date(inquiry.createdAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
              })}
            </span>
          </div>
          <p className="text-muted-foreground mt-0.5 truncate text-xs">{inquiry.message}</p>
          {inquiry.replies.length > 0 && (
            <div className="mt-1 flex items-center gap-1">
              <MessageSquare className="text-muted-foreground h-3 w-3" />
              <span className="text-muted-foreground text-xs">{inquiry.replies.length}</span>
            </div>
          )}
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
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            Messages
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground text-sm">
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
