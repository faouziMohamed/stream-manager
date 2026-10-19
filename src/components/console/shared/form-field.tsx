import type { ReactNode } from 'react';

import { Label } from '@/components/ui/label';

/**
 * Label + control + error, in one place.
 *
 * This existed as a private copy inside two feature forms; it is shared so a
 * third form cannot drift from the other two.
 */
export function FormField({ children, error, hint, label }: FormFieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
      {hint === undefined || error !== undefined ? null : (
        <p className="text-xs text-(--sm-muted)">{hint}</p>
      )}
      {error === undefined ? null : <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

type FormFieldProps = {
  children: ReactNode;
  error?: string;
  hint?: string;
  label: string;
};
