import * as React from 'react';

import { cn } from '@/lib/utils';

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { className, ...props },
  ref
) {
  return (
    <label
      ref={ref}
      data-slot="label"
      className={cn('text-sm leading-none font-medium', className)}
      {...props}
    />
  );
});

type LabelProps = React.ComponentProps<'label'>;
