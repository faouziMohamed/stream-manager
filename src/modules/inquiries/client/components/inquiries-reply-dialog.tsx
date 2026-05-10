'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Mail, MailOpen, Phone, Send, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FormGroup } from '@/components/ui/form-group';
import { ConfirmDialog } from '@/components/console/confirm-dialog';
import {
  useDeleteInquiry,
  useMarkInquiryRead,
  useReplyToInquiry,
} from '@/lib/hooks/queries/use-notifications.queries';
import type { InquiryDto } from '@/lib/graphql/operations/settings.operations';

// ─── Types ────────────────────────────────────────────────────────────────────

const replySchema = z.object({
  body: z.string().min(1, 'La réponse ne peut pas être vide'),
});
type ReplyForm = z.infer<typeof replySchema>;

interface Props {
  inquiry: InquiryDto;
  onBack: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
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
    defaultValues: { body: '' },
  });

  const onSubmit = async (data: ReplyForm) => {
    await reply.mutateAsync({ id: inquiry.id, body: data.body });
    form.reset();
  };

  const toggleRead = () => markRead.mutate({ id: inquiry.id, isRead: !inquiry.isRead });

  return (
    <div className="flex h-full flex-col">
      {/* Thread header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 cursor-pointer">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{inquiry.name}</p>
          <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
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
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRead}
            title={inquiry.isRead ? 'Marquer non lu' : 'Marquer lu'}
            className="cursor-pointer"
          >
            {inquiry.isRead ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteOpen(true)}
            className="text-destructive hover:text-destructive cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {/* Original message */}
        <div className="flex gap-3">
          <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
            {getInitials(inquiry.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline gap-2">
              <span className="text-sm font-medium">{inquiry.name}</span>
              <span className="text-muted-foreground text-xs">{formatDate(inquiry.createdAt)}</span>
            </div>
            <div className="bg-muted/50 rounded-lg rounded-tl-none px-3 py-2.5 text-sm whitespace-pre-wrap">
              {inquiry.message}
            </div>
          </div>
        </div>

        {/* Replies */}
        {inquiry.replies.map((r) => (
          <div key={r.id} className="flex flex-row-reverse gap-3">
            <div className="bg-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
              <User className="text-primary-foreground h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-baseline justify-end gap-2">
                <span className="text-muted-foreground text-xs">{formatDate(r.sentAt)}</span>
                <span className="text-sm font-medium">Vous</span>
              </div>
              <div className="bg-primary/10 border-primary/20 rounded-lg rounded-tr-none border px-3 py-2.5 text-sm whitespace-pre-wrap">
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
            <FormGroup label="Réponse" error={form.formState.errors.body?.message}>
              <Textarea
                {...form.register('body')}
                placeholder={`Répondre à ${inquiry.name}…`}
                rows={3}
                className="resize-none"
              />
            </FormGroup>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs">
                Sera envoyé à <span className="font-medium">{inquiry.email}</span>
              </p>
              <Button type="submit" size="sm" disabled={reply.isPending} className="cursor-pointer">
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {reply.isPending ? 'Envoi…' : 'Envoyer'}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="text-muted-foreground border-t p-4 text-center text-sm italic">
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
