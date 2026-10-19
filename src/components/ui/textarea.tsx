import * as React from 'react';

import { cn } from '@/lib/utils';

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, error, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      aria-invalid={error === undefined ? undefined : true}
      className={cn(
        'border-input bg-background flex min-h-28 w-full resize-y rounded-md border px-3 py-2 text-sm',
        'placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error !== undefined && 'border-destructive focus-visible:ring-destructive',
        className
      )}
      {...props}
    />
  );
});

type TextareaProps = React.ComponentProps<'textarea'> & {
  error?: string;
};
