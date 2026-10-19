'use client';

import { ArrowRight, ImageIcon } from 'lucide-react';
import Link from 'next/link';

import { RichTextContent } from '@/components/shared/rich-text/rich-text-content';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

export interface ServiceSummary {
  category: string;
  descriptionContent?: unknown;
  id: string;
  imageUrl?: string | null;
  isActive: boolean;
  name: string;
  supportsProfiles: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  gaming: 'Gaming',
  music: 'Music streaming',
  other: 'Other service',
  video: 'Video streaming',
};

export function ServiceDetailSheet({
  service,
  open,
  onOpenChangeAction,
}: {
  service: ServiceSummary | null;
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChangeAction}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        {service === null ? null : (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-(--sm-border) bg-(--sm-bg)">
                  {service.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-5 text-(--sm-muted)" />
                  )}
                </div>
                <div className="min-w-0">
                  <SheetTitle className="truncate">{service.name}</SheetTitle>
                  <SheetDescription>
                    {CATEGORY_LABELS[service.category] ?? service.category}
                  </SheetDescription>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={service.isActive ? 'default' : 'outline'}>
                  {service.isActive ? 'Active' : 'Archived'}
                </Badge>
                <Badge variant="secondary">
                  {service.supportsProfiles ? 'Profile-level' : 'Account-level'}
                </Badge>
              </div>
            </SheetHeader>

            <div className="flex-1 px-4 py-2">
              <p className="text-xs font-semibold tracking-wider text-(--sm-muted) uppercase">
                Description
              </p>
              <RichTextContent
                value={service.descriptionContent}
                className="mt-2"
                fallback={
                  <p className="mt-2 text-sm text-(--sm-muted)">No description added yet.</p>
                }
              />
            </div>

            <SheetFooter>
              <Link
                href={ROUTES.console.serviceDetail(service.id)}
                className={cn(buttonVariants({ variant: 'accent' }), 'w-full gap-2')}
              >
                Open full details
                <ArrowRight className="size-4" />
              </Link>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
