"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useMounted } from "@/lib/hooks/use-mounted";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Theme = "light" | "dark" | "system";

const ThemeOptionIcon = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} satisfies Record<Theme, React.ElementType>;

const themeLabels: Record<Theme, string> = {
  light: "Clair",
  dark: "Sombre",
  system: "Système",
};

interface Props {
  label?: string | null;
}

export function SharedSummaryHeader({ label }: Props) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  const ThemeIcon = mounted && resolvedTheme === "dark" ? Moon : Sun;

  return (
    <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="h-4 w-4 text-primary shrink-0" />
          <span className="font-semibold text-sm">StreamManager</span>
          {label && (
            <>
              <span className="text-muted-foreground/50 text-sm">·</span>
              <span className="text-sm text-muted-foreground truncate max-w-48">
                {label}
              </span>
            </>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Changer le thème"
              className="cursor-pointer"
            >
              <ThemeIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>Thème</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(
              Object.entries(ThemeOptionIcon) as [Theme, React.ElementType][]
            ).map(([value, Icon]) => (
              <DropdownMenuItem
                key={value}
                onClick={() => setTheme(value)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {themeLabels[value]}
                </span>
                {theme === value && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
