'use client';

import { Check, ChevronRight, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface WorkflowStep {
  label: string;
  href?: string;
  active?: boolean;
  description?: string;
}

interface WorkflowHintProps {
  steps: WorkflowStep[];
  title: string;
  className?: string;
}

export function WorkflowHint({ steps, title, className }: WorkflowHintProps) {
  const activeIndex = steps.findIndex((s) => s.active);

  return (
    <div className={cn('bg-card rounded-xl border p-5 shadow-sm', className)}>
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full sm:flex">
          <Lightbulb className="text-primary h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-muted-foreground/70 text-xs font-semibold tracking-wider uppercase">
              {title}
            </p>
            <p className="text-muted-foreground/50 mt-0.5 text-xs">
              Les étapes clés pour vous guider dans votre configuration
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            {steps.map((step, i) => {
              const isActive = step.active;
              const isCompleted = i < activeIndex;
              const isUpcoming = i > activeIndex;

              return (
                <div key={step.label} className="flex items-start gap-1.5">
                  {i > 0 && (
                    <ChevronRight className="text-muted-foreground/20 mt-2.5 h-4 w-4 shrink-0" />
                  )}
                  {step.href ? (
                    <Link
                      href={step.href}
                      className={cn(
                        'group flex min-w-0 flex-col rounded-lg px-3 py-2 text-sm transition-colors',
                        isCompleted && 'bg-primary/5 hover:bg-primary/10',
                        isUpcoming &&
                          'text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground'
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        {isCompleted && <Check className="text-primary h-3.5 w-3.5 shrink-0" />}
                        {step.label}
                      </span>
                      {step.description && (
                        <span
                          className={cn(
                            'mt-0.5 max-w-44 text-xs leading-snug',
                            isCompleted && 'text-primary/60',
                            isUpcoming && 'text-muted-foreground/40'
                          )}
                        >
                          {step.description}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        'flex min-w-0 flex-col rounded-lg px-3 py-2 text-sm',
                        isActive && 'bg-primary text-primary-foreground shadow-sm',
                        isUpcoming && 'text-muted-foreground/50'
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        {step.label}
                      </span>
                      {step.description && (
                        <span
                          className={cn(
                            'mt-0.5 max-w-44 text-xs leading-snug',
                            isActive && 'text-primary-foreground/70',
                            isUpcoming && 'text-muted-foreground/40'
                          )}
                        >
                          {step.description}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
