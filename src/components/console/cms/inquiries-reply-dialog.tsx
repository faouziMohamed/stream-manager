"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronLeft,
  Mail,
  MailOpen,
  Phone,
  Send,
  Trash2,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormGroup } from "@/components/ui/form-group";
import { ConfirmDialog } from "@/components/console/confirm-dialog";
import {
  useDeleteInquiry,
  useMarkInquiryRead,
  useReplyToInquiry,
} from "@/lib/hooks/queries/use-notifications.queries";
import type { InquiryDto } from "@/lib/graphql/operations/settings.operations";

// ─── Types ────────────────────────────────────────────────────────────────────

const replySchema = z.object({
  body: z.string().min(1, "La réponse ne peut pas être vide"),
});
type ReplyForm = z.infer<typeof replySchema>;

interface Props {
  inquiry: InquiryDto;
  onBack: () => void;
}

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

// ─── Component ────────────────────────────────────────────────────────────────

export function InquiryReplyDialog({ inquiry, onBack }: Props) {
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormGroup
              label="Réponse"
              error={form.formState.errors.body?.message}
            >
              <Textarea
                {...form.register("body")}
                placeholder={`Répondre à ${inquiry.name}…`}
                rows={3}
                className="resize-none"
              />
            </FormGroup>
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
