"use client";

import { useState } from "react";
import { Archive, CheckCheck, Circle, Mail, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useInquiries,
  useMarkInquiryRead,
} from "@/lib/hooks/queries/use-notifications.queries";
import type { InquiryDto } from "@/lib/graphql/operations/settings.operations";
import { InquiryReplyDialog } from "@/components/console/cms/inquiries-reply-dialog";
import { cn } from "@/lib/utils/helpers";

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
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-3 border-b transition-colors cursor-pointer",
        "hover:bg-accent/50",
        selected && "bg-accent",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0">
          {inquiry.isRead ? (
            <Circle className="h-2 w-2 text-transparent" />
          ) : (
            <Circle className="h-2 w-2 fill-primary text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "text-sm truncate",
                !inquiry.isRead && "font-semibold",
              )}
            >
              {inquiry.name}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              {new Date(inquiry.createdAt).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {inquiry.message}
          </p>
          {inquiry.replies.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <MessageSquare className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {inquiry.replies.length}
              </span>
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
    inquiries
      .filter((i) => !i.isRead)
      .forEach((i) => markRead.mutate({ id: i.id, isRead: true }));
  };

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
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
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={unreadOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setUnreadOnly(!unreadOnly)}
            className="cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5 mr-1.5" />
            Non lus {unreadOnly ? "(actif)" : ""}
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              className="cursor-pointer"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
              Tout marquer lu
            </Button>
          )}
        </div>
      </div>

      {/* Main panel */}
      <Card className="overflow-hidden">
        <div className="flex h-[calc(100vh-220px)] min-h-[500px]">
          {/* Left: list */}
          <div
            className={cn(
              "flex flex-col border-r w-full md:w-80 lg:w-96 shrink-0",
              selected && "hidden md:flex",
            )}
          >
            <div className="px-4 py-2.5 border-b bg-muted/30">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {filtered.length} message{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                  <Archive className="h-10 w-10 opacity-30" />
                  <p className="text-sm">
                    {unreadOnly ? "Aucun message non lu" : "Aucun message"}
                  </p>
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
          <div
            className={cn(
              "flex-1 flex flex-col",
              !selected && "hidden md:flex",
            )}
          >
            {selected ? (
              <InquiryReplyDialog
                key={selected.id}
                inquiry={selected}
                onBack={() => setSelectedId(null)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
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
