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
import { LogOut, Moon, Sun, Monitor, Check } from 'lucide-react';
import { useTheme } from 'next-themes';

const logger = clientLogger('console-topbar');

type Theme = 'light' | 'dark' | 'system';

const themeOptions: { value: Theme; label: string; icon: React.ElementType }[] = [
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

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push('/auth/login');
    } catch (err) {
      logger.error('Sign out failed', err);
    }
  };

  const ThemeIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6 shrink-0">
      <h1 className="text-sm font-semibold text-muted-foreground">
        {title ?? 'Console'}
      </h1>
      <div className="flex items-center gap-1">
        {/* Theme selector dropdown */}
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
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                {theme === value && <Check className="h-3.5 w-3.5 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sign out */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          aria-label="Se déconnecter"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
