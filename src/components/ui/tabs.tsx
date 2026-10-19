'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';

import { cn } from '@/lib/utils';

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  );
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'relative inline-flex w-fit items-stretch gap-1 rounded-lg border border-(--sm-border) bg-(--sm-surface) p-1',
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap',
        'text-(--sm-muted) transition-colors outline-none',
        // Scoped to inactive tabs: an unscoped hover repaints over the active
        // fill, so hovering the current tab made it read as unselected.
        // `--sm-active`, not `--sm-hover`: a tab sits on `--sm-surface`, where
        // the hover step is too faint to read as a filled control beside the
        // saturated active pill — equal boxes, unequal weight.
        'not-data-active:hover:bg-(--sm-active) not-data-active:hover:text-(--sm-fg)',
        'focus-visible:ring-2 focus-visible:ring-(--sm-focus)',
        // Base UI renders `data-active` on the selected tab, not `data-selected`.
        'data-active:bg-(--sm-coral) data-active:text-(--sm-coral-fg)',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

function TabsPanel({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-panel"
      className={cn('outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsPanel, TabsTrigger };
