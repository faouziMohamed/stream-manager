'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/auth-client';
import { clientLogger } from '@/lib/logger/client-logger';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, LogOut, Menu, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSidebar } from '@/components/console/sidebar-context';
import type { ElementType } from 'react';
import { useMounted } from '@/lib/hooks/use-mounted';
import { ROUTES } from '@/lib/config/routes';

const logger = clientLogger('console-topbar');

type Theme = 'light' | 'dark' | 'system';

const themeOptions: { value: Theme; label: string; icon: ElementType }[] = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Système', icon: Monitor },
];

interface ConsoleTopbarProps {
  title?: string;
}

export function ConsoleTopbar({ title }: ConsoleTopbarProps) {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { toggle } = useSidebar();
  const mounted = useMounted();

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push(ROUTES.auth.login);
    } catch (error) {
      logger.error('Sign out failed', error);
    }
  };

  const ThemeIcon = mounted && resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <header className="bg-card flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6">
      {/* Hamburger — mobile only */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 md:hidden"
        onClick={toggle}
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <h1 className="text-muted-foreground flex-1 truncate text-sm font-semibold">
        {title ?? 'Console'}
      </h1>

      <div className="flex shrink-0 items-center gap-1">
        {/* Theme selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Changer le thème">
              <ThemeIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>Thème</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <DropdownMenuItem
                key={value}
                onClick={() => setTheme(value)}
                className="flex cursor-pointer items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                {theme === value && <Check className="text-primary h-3.5 w-3.5" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          aria-label="Se déconnecter"
          className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-9 cursor-pointer items-center justify-center rounded-md transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
