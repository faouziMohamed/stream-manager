"use client";

import { type ReactNode } from "react";
import { Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FormGroupProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormGroup({
  label,
  required,
  hint,
  error,
  children,
  className,
}: FormGroupProps) {
  return (
    <div className={cn("space-y-1.5 group", className)}>
      <div className="flex items-center gap-1">
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        {hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-60">
              <p className="text-xs">{hint}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {children}
      {error && (
        <p className="text-xs text-destructive sm-fade-in flex items-center gap-1.5">
          <span className="size-1 rounded-full bg-destructive shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
