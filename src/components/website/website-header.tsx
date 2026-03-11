'use client';

import Link from 'next/link';
import {Check, Monitor, Moon, Sun} from 'lucide-react';
import {useTheme} from 'next-themes';
import {Button} from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Theme = 'light' | 'dark' | 'system';

// Use correct icon per option
const ThemeOptionIcon = {
    light: Sun,
    dark: Moon,
    system: Monitor,
} satisfies Record<Theme, React.ElementType>;

export function WebsiteHeader() {
    const {theme, setTheme, resolvedTheme} = useTheme();
    const ThemeIcon = resolvedTheme === 'dark' ? Moon : Sun;

    return (
        <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                    <Monitor className="h-5 w-5 text-primary"/>
                    StreamManager
                </Link>

                <nav className="flex items-center gap-4 text-sm">
                    <Link
                        href="/"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Offres
                    </Link>
                    <Link
                        href="/contact"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Contact
                    </Link>
                    <Link href="/console" className="text-primary hover:underline font-medium">
                        Espace admin
                    </Link>

                    {/* Theme selector */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Changer le thème">
                                <ThemeIcon className="h-4 w-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuLabel>Thème</DropdownMenuLabel>
                            <DropdownMenuSeparator/>
                            {(Object.entries(ThemeOptionIcon) as [Theme, React.ElementType][]).map(
                                ([value, Icon]) => {
                                    const labels: Record<Theme, string> = {
                                        light: 'Clair',
                                        dark: 'Sombre',
                                        system: 'Système',
                                    };
                                    return (
                                        <DropdownMenuItem
                                            key={value}
                                            onClick={() => setTheme(value)}
                                            className="flex items-center justify-between cursor-pointer"
                                        >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4"/>
                          {labels[value]}
                      </span>
                                            {theme === value && <Check className="h-3.5 w-3.5 text-primary"/>}
                                        </DropdownMenuItem>
                                    );
                                },
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </nav>
            </div>
        </header>
    );
}
