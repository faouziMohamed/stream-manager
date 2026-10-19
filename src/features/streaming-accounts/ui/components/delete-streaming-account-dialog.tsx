'use client';

import { Trash2 } from 'lucide-react';

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

export type DeleteStreamingAccountTarget = {
  id: string;
  label: string;
  profileCount: number;
};

type DeleteStreamingAccountDialogProps = {
  isPending: boolean;
  target: DeleteStreamingAccountTarget | undefined;
  onConfirmAction: () => void;
  onOpenChangeAction: (open: boolean) => void;
};

export function DeleteStreamingAccountDialog({
  isPending,
  target,
  onConfirmAction,
  onOpenChangeAction,
}: DeleteStreamingAccountDialogProps) {
  const hasProfiles = (target?.profileCount ?? 0) > 0;

  return (
    <AlertDialog open={target !== undefined} onOpenChange={onOpenChangeAction}>
      <AlertDialogContent className="border border-(--sm-border) bg-(--sm-surface)">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 className="size-5" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-(--sm-fg)">
            Delete &ldquo;{target?.label}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-(--sm-muted)">
            {hasProfiles ? (
              <>
                This account has <strong>{target?.profileCount}</strong> profile
                {(target?.profileCount ?? 0) > 1 ? 's' : ''}. All unassigned profiles will be
                permanently deleted. Assigned profiles must be unassigned first.
              </>
            ) : (
              'This account and all its data will be permanently deleted. This action cannot be undone.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirmAction}
          >
            {isPending ? 'Deleting…' : 'Delete account'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
