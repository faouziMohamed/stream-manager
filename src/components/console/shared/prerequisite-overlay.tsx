import { AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function PrerequisiteOverlay({
  description,
  onCloseAction,
  requirements,
  title,
}: PrerequisiteOverlayProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-(--sm-bg)/85 p-6 backdrop-blur-sm">
      <div className="w-full max-w-xs space-y-4 rounded-xl border border-(--sm-border) bg-(--sm-surface) p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg border border-(--sm-gold-b) bg-(--sm-gold-s) text-(--sm-gold-t)">
            <AlertTriangle className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-(--sm-fg)">{title}</p>
            <p className="mt-0.5 text-xs text-(--sm-muted)">{description}</p>
          </div>
        </div>
        <div className="space-y-2">
          {requirements.map((req) => (
            <Link
              key={req.href}
              href={req.href}
              onClick={onCloseAction}
              className="flex items-center justify-between rounded-lg border border-(--sm-border) bg-(--sm-bg) px-3 py-2.5 text-xs font-medium text-(--sm-fg) transition-colors hover:border-(--sm-gold-b) hover:bg-(--sm-gold-s)"
            >
              {req.label}
              <ArrowRight className="size-3.5 shrink-0 text-(--sm-muted)" />
            </Link>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={onCloseAction}>
          Close
        </Button>
      </div>
    </div>
  );
}

type Requirement = { label: string; href: string };

type PrerequisiteOverlayProps = {
  description: string;
  /** Dialogs close themselves when the visitor follows a link; pages have nothing to close. */
  onCloseAction?: () => void;
  requirements: Requirement[];
  title: string;
};
