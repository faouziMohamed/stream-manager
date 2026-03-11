"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Archive,
  CheckCheck,
  ChevronLeft,
  Circle,
  Mail,
  MailOpen,
  MessageSquare,
  Phone,
  Send,
  Trash2,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/console/confirm-dialog";
import {
  useDeleteInquiry,
  useInquiries,
  useMarkInquiryRead,
  useReplyToInquiry,
} from "@/lib/hooks/queries/use-settings.queries";
import type { InquiryDto } from "@/lib/graphql/operations/settings.operations";
import { cn } from "@/lib/utils/helpers";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  initialData?: InquiryDto[];
}

const replySchema = z.object({
  body: z.string().min(1, "La réponse ne peut pas être vide"),
});
type ReplyForm = z.infer<typeof replySchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── InquiryThread ────────────────────────────────────────────────────────────

function InquiryThread({
  inquiry,
  onBack,
}: {
  inquiry: InquiryDto;
  onBack: () => void;
}) {
  const markRead = useMarkInquiryRead();
  const reply = useReplyToInquiry();
  const deleteInquiry = useDeleteInquiry();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const form = useForm<ReplyForm>({
    resolver: zodResolver(replySchema),
    defaultValues: { body: "" },
  });

  const onSubmit = async (data: ReplyForm) => {
    await reply.mutateAsync({ id: inquiry.id, body: data.body });
    form.reset();
  };

  const toggleRead = () =>
    markRead.mutate({ id: inquiry.id, isRead: !inquiry.isRead });

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="cursor-pointer shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{inquiry.name}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {inquiry.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {inquiry.email}
              </span>
            )}
            {inquiry.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {inquiry.phone}
              </span>
            )}
            <span>{formatDate(inquiry.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRead}
            title={inquiry.isRead ? "Marquer non lu" : "Marquer lu"}
            className="cursor-pointer"
          >
            {inquiry.isRead ? (
              <Mail className="h-4 w-4" />
            ) : (
              <MailOpen className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteOpen(true)}
            className="cursor-pointer text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Original message */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
            {getInitials(inquiry.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-medium text-sm">{inquiry.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatDate(inquiry.createdAt)}
              </span>
            </div>
            <div className="bg-muted/50 rounded-lg rounded-tl-none px-3 py-2.5 text-sm whitespace-pre-wrap">
              {inquiry.message}
            </div>
          </div>
        </div>

        {/* Replies */}
        {inquiry.replies.map((r) => (
          <div key={r.id} className="flex gap-3 flex-row-reverse">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 justify-end mb-1">
                <span className="text-xs text-muted-foreground">
                  {formatDate(r.sentAt)}
                </span>
                <span className="font-medium text-sm">Vous</span>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-lg rounded-tr-none px-3 py-2.5 text-sm whitespace-pre-wrap">
                {r.body}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply box */}
      {inquiry.email ? (
        <div className="border-t p-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <Textarea
              {...form.register("body")}
              placeholder={`Répondre à ${inquiry.name}…`}
              rows={3}
              className="resize-none"
            />
            {form.formState.errors.body && (
              <p className="text-xs text-destructive">
                {form.formState.errors.body.message}
              </p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Sera envoyé à{" "}
                <span className="font-medium">{inquiry.email}</span>
              </p>
              <Button
                type="submit"
                size="sm"
                disabled={reply.isPending}
                className="cursor-pointer"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                {reply.isPending ? "Envoi…" : "Envoyer"}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="border-t p-4 text-sm text-muted-foreground italic text-center">
          Pas d&apos;adresse e-mail — impossible de répondre par mail
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer ce message ?"
        description="Cette action est irréversible."
        onConfirm={async () => {
          await deleteInquiry.mutateAsync(inquiry.id);
          setDeleteOpen(false);
          onBack();
        }}
      />
    </div>
  );
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
    // Auto-mark as read when opened
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
              <InquiryThread
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
