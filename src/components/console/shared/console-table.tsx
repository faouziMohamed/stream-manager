import type { ComponentProps, ReactNode } from 'react';

import { Table, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export function ConsoleTable({ children, className }: ConsoleTableProps) {
  return (
    <div
      className={cn(
        'overflow-x-auto rounded-xl border border-(--sm-border) bg-(--sm-surface)',
        className
      )}
    >
      <Table>{children}</Table>
    </div>
  );
}

export function ConsoleHeadRow({ children }: { children: ReactNode }) {
  return (
    <TableRow className="border-b border-(--sm-border) hover:bg-transparent">{children}</TableRow>
  );
}

export function ConsoleTh({ children, className, ...props }: ComponentProps<typeof TableHead>) {
  return (
    <TableHead
      className={cn(
        'px-4 py-3 text-xs font-semibold tracking-[0.16em] text-(--sm-muted) uppercase sm:px-6',
        className
      )}
      {...props}
    >
      {children}
    </TableHead>
  );
}

export function ConsoleRow({ children, className, ...props }: ComponentProps<typeof TableRow>) {
  return (
    <TableRow
      className={cn(
        'border-b border-(--sm-border) last:border-b-0 hover:bg-(--sm-hover)',
        className
      )}
      {...props}
    >
      {children}
    </TableRow>
  );
}

export function ConsoleTd({ children, className, ...props }: ComponentProps<typeof TableCell>) {
  return (
    <TableCell className={cn('px-4 py-4 sm:px-6', className)} {...props}>
      {children}
    </TableCell>
  );
}

type ConsoleTableProps = {
  children: ReactNode;
  className?: string;
};
