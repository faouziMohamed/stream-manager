'use client';

import type { ReactNode } from 'react';

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

const MEDIA_TONE = {
  accent: 'bg-(--sm-coral-s) text-(--sm-coral-t)',
  caution: 'bg-(--sm-gold-s) text-(--sm-gold-t)',
  destructive: 'bg-(--sm-coral-s) text-(--sm-coral-t)',
} as const;

const ACTION_TONE = {
  accent: 'bg-(--sm-coral) text-(--sm-coral-fg) hover:opacity-90',
  caution: 'bg-(--sm-gold) text-(--sm-gold-fg) hover:opacity-90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
} as const;

/**
 * One confirmation dialog for every action that changes data on a single
 * click, so a misclick never commits.
 */
export function ConfirmActionDialog({
  cancelLabel = 'Cancel',
  confirmLabel,
  description,
  details,
  icon,
  onConfirm,
  onOpenChangeAction,
  open,
  pending = false,
  title,
  tone = 'accent',
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChangeAction}>
      <AlertDialogContent className="border border-(--sm-border) bg-(--sm-surface)">
        <AlertDialogHeader>
          <AlertDialogMedia className={MEDIA_TONE[tone]}>{icon}</AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {details === undefined ? null : details}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction className={ACTION_TONE[tone]} disabled={pending} onClick={onConfirm}>
            {pending ? 'Working…' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type ConfirmActionDialogProps = {
  cancelLabel?: string;
  confirmLabel: string;
  description: ReactNode;
  /** Consequence detail rendered between the description and the actions. */
  details?: ReactNode;
  icon: ReactNode;
  onConfirm: () => void;
  onOpenChangeAction: (open: boolean) => void;
  open: boolean;
  pending?: boolean;
  title: string;
  tone?: keyof typeof ACTION_TONE;
};
