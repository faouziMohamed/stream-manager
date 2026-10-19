'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function DeletePlanDialog({
  isPending,
  onConfirmAction,
  onOpenChangeAction,
  plan,
}: DeletePlanDialogProps) {
  return (
    <AlertDialog open={plan !== undefined} onOpenChange={onOpenChangeAction}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete plan?</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to permanently delete{' '}
            <span className="font-semibold text-(--sm-fg)">{plan?.name}</span>. This action cannot
            be undone. Plans with active memberships cannot be deleted — you must deactivate or
            reassign those memberships first.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} onClick={() => onOpenChangeAction(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirmAction}
          >
            {isPending ? 'Deleting…' : 'Delete plan'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type DeletePlanDialogProps = {
  isPending: boolean;
  onConfirmAction: () => void;
  onOpenChangeAction: (open: boolean) => void;
  plan: { id: string; name: string } | undefined;
};
