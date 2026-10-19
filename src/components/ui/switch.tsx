'use client';

import { Switch as SwitchPrimitive } from '@base-ui/react/switch';

import { cn } from '@/lib/utils';

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-(--sm-border) bg-(--sm-surface2) p-0.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-(--sm-focus) data-checked:border-(--sm-coral-b) data-checked:bg-(--sm-coral) data-disabled:cursor-not-allowed data-disabled:opacity-50',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-5 rounded-full bg-(--sm-fg) shadow-sm transition-transform data-checked:translate-x-5 data-checked:bg-(--sm-coral-fg)" />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
