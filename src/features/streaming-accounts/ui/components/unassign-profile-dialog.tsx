'use client';

import { Link2Off } from 'lucide-react';

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

export type UnassignProfileTarget = {
  accountId: string;
  assignmentId: string;
  membershipId: string;
  profileId: string;
  profileName: string;
};

type UnassignProfileDialogProps = {
  isPending: boolean;
  onConfirmAction: () => void;
  onOpenChangeAction: (open: boolean) => void;
  target?: UnassignProfileTarget;
};

export function UnassignProfileDialog({
  isPending,
  onConfirmAction,
  onOpenChangeAction,
  target,
}: UnassignProfileDialogProps) {
  return (
    <AlertDialog open={target !== undefined} onOpenChange={(open) => onOpenChangeAction(open)}>
      <AlertDialogContent className="border border-(--sm-border) bg-(--sm-surface)">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-(--sm-coral-s) text-(--sm-coral-t)">
            <Link2Off className="size-5" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-(--sm-fg)">Unassign this profile?</AlertDialogTitle>
          <AlertDialogDescription className="text-(--sm-muted)">
            {target?.profileName ?? 'This profile'} will be released and become available for
            another customer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Keep assignment</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} variant="accent" onClick={onConfirmAction}>
            {isPending ? 'Unassigning...' : 'Unassign profile'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
