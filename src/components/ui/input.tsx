import * as React from 'react';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, icon: Icon, ...props },
  ref
) {
  const field = (
    <input
      ref={ref}
      data-slot="input"
      aria-invalid={error === undefined ? undefined : true}
      className={cn(
        'border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm',
        'ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error !== undefined && 'border-destructive focus-visible:ring-destructive',
        // The offset lives here so every iconned field in the app lines up,
        // instead of each form inventing its own padding.
        Icon !== undefined && 'pl-9',
        className
      )}
      {...props}
    />
  );

  if (Icon === undefined) {
    return field;
  }

  return (
    <div className="relative" data-slot="input-with-icon">
      <Icon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-(--sm-muted)"
      />
      {field}
    </div>
  );
});

type InputProps = React.ComponentProps<'input'> & {
  error?: string;
  /**
   * Leading icon naming the DATA in the field (Mail for an e-mail, Phone for a
   * number). Decorative: it repeats the label visually, never replaces it.
   */
  icon?: LucideIcon;
};
