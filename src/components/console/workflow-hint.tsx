"use client";

import { ArrowRight, Lightbulb } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface WorkflowStep {
  label: string;
  href?: string;
  active?: boolean;
}

interface WorkflowHintProps {
  steps: WorkflowStep[];
  className?: string;
}

export function WorkflowHint({ steps, className }: WorkflowHintProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-lg border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
      <span className="font-medium">Parcours&nbsp;:</span>
      {steps.map((step, i) => (
        <span key={step.label} className="flex items-center gap-1.5">
          {i > 0 && <ArrowRight className="h-3 w-3 text-muted-foreground/50" />}
          {step.href ? (
            <Link
              href={step.href}
              className="rounded-md px-1.5 py-0.5 text-primary underline-offset-4 hover:underline"
            >
              {step.label}
            </Link>
          ) : (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5",
                step.active && "bg-primary/10 text-primary font-medium",
              )}
            >
              {step.label}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
