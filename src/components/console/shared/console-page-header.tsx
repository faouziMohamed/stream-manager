import type { ReactNode } from 'react';

export function ConsolePageHeader({ actions, description, title }: ConsolePageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-(--sm-border) pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6 sm:pb-6">
      <div className="max-w-2xl">
        <h1 className="sm-title text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="sm-subtitle mt-1.5 max-w-xl text-sm leading-6">{description}</p>
      </div>
      {actions === undefined ? null : (
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
      )}
    </header>
  );
}

type ConsolePageHeaderProps = {
  actions?: ReactNode;
  description: string;
  title: string;
};
