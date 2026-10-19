'use client';

import { Check, ChevronDown, Monitor, Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type ThemeChoice = 'light' | 'dark' | 'system';

type ThemeDropdownProps = {
  className?: string;
  popupClassName?: string;
  triggerLabel?: string;
  iconOnly?: boolean;
};

const themeOptions: Array<{
  value: ThemeChoice;
  label: string;
  icon: typeof Sun;
}> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function ThemeDropdown({
  className,
  popupClassName,
  triggerLabel = 'Theme',
  iconOnly = false,
}: ThemeDropdownProps) {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const mounted = useIsMounted();
  const activeTheme =
    mounted && themeOptions.some((option) => option.value === theme)
      ? (theme as ThemeChoice)
      : 'system';
  const ThemeIcon = mounted && resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-(--sm-border) bg-(--sm-surface) px-3 text-sm font-medium text-(--sm-fg) transition-colors',
          'focus-visible:ring-ring hover:bg-(--sm-hover) focus-visible:ring-2 focus-visible:outline-none',
          iconOnly && 'size-9 p-0',
          className
        )}
        aria-label="Change theme"
      >
        <ThemeIcon className="size-4 text-(--sm-muted)" />
        {iconOnly ? null : (
          <span className="hidden sm:inline">{getThemeLabel(activeTheme, triggerLabel)}</span>
        )}
        {iconOnly ? null : <ChevronDown className="size-3.5 text-(--sm-muted)" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={cn(
          'min-w-44 rounded-2xl border border-(--sm-border) bg-(--sm-surface) p-1.5 shadow-[0_18px_48px_var(--sm-card-shadow)]',
          popupClassName
        )}
      >
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const selected = activeTheme === option.value;

          return (
            <DropdownMenuItem
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm focus:bg-(--sm-surface2)"
              onClick={() => setTheme(option.value)}
            >
              <Icon className="size-4 text-(--sm-muted)" />
              <span className="flex-1">{option.label}</span>
              {selected ? <Check className="size-4 text-(--sm-coral)" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function useIsMounted(): boolean {
  return useSyncExternalStore(subscribeMounted, getMountedSnapshot, getServerMountedSnapshot);
}

function subscribeMounted() {
  return unsubscribeMounted;
}

function unsubscribeMounted() {
  return;
}

function getMountedSnapshot() {
  return true;
}

function getServerMountedSnapshot() {
  return false;
}

function getThemeLabel(theme: ThemeChoice, triggerLabel: string): string {
  const label = themeOptions.find((option) => option.value === theme)?.label ?? 'System';
  return `${triggerLabel}: ${label}`;
}
