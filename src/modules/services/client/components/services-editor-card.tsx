'use client';

import { ChevronDown, ChevronRight, EyeOff, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PlansTable } from './services-plans-manager';
import { cn } from '@/lib/utils/helpers';
import type { ServiceDto } from '@/lib/graphql/operations/services.operations';
import { RichTextContent } from '@/components/rich-text/rich-text-content';

// ─── Color palette (same deterministic hash as accounts) ─────────────────────

const GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-blue-600',
  'from-fuchsia-500 to-violet-600',
  'from-teal-500 to-emerald-600',
];

function gradientForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++)
    h = Math.trunc(Math.imul(31, h) + (name.codePointAt(i) ?? 0));
  return GRADIENTS[Math.abs(h) % GRADIENTS.length]!;
}

function getInitial(name: string): string {
  return name.trim()[0]?.toUpperCase() ?? '?';
}

// ─── Active service card ──────────────────────────────────────────────────────

interface ActiveServiceCardProps {
  service: ServiceDto;
  expanded: boolean;
  defaultCurrency: string;
  onToggleExpand: (id: string) => void;
  onEdit: (service: ServiceDto) => void;
  onDelete: (service: ServiceDto) => void;
}

export function ActiveServiceCard({
  service,
  expanded,
  defaultCurrency,
  onToggleExpand,
  onEdit,
  onDelete,
}: ActiveServiceCardProps) {
  const gradient = gradientForName(service.name);
  return (
    <Card className={cn(service.isActive ? '' : 'opacity-60', 'card-hover overflow-hidden')}>
      {/* Gradient stripe */}
      <div className={cn('h-1 w-full bg-linear-to-r', gradient)} />
      <CardHeader className="px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="hover:text-primary flex cursor-pointer items-center gap-2 text-left font-semibold transition-colors"
            onClick={() => onToggleExpand(service.id)}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}

            {/* Logo or initial avatar */}
            {service.logoUrl ? (
              <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded">
                <Image src={service.logoUrl} alt="" fill className="object-cover" sizes="24px" />
              </div>
            ) : (
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded bg-linear-to-br text-xs font-bold text-white',
                  gradient
                )}
              >
                {getInitial(service.name)}
              </div>
            )}

            {service.name}
            <Badge variant="outline" className="text-xs">
              {service.category}
            </Badge>
            {!service.isActive && <Badge variant="secondary">Inactif</Badge>}
            {!service.showOnHomepage && (
              <Badge variant="outline" className="text-muted-foreground gap-1 text-xs">
                <EyeOff className="h-3 w-3" />
                Masqué
              </Badge>
            )}
          </button>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 cursor-pointer"
              onClick={() => onEdit(service)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive h-8 w-8 cursor-pointer"
              onClick={() => onDelete(service)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {Boolean(service.description) && (
          <RichTextContent
            className="text-muted-foreground ml-6 text-xs"
            value={service.description}
          />
        )}
      </CardHeader>
      {expanded && (
        <CardContent className="px-4 pt-0 pb-4">
          <PlansTable serviceId={service.id} currency={defaultCurrency} />
        </CardContent>
      )}
    </Card>
  );
}

// ─── Deleted service card ─────────────────────────────────────────────────────

interface DeletedServiceCardProps {
  service: ServiceDto;
  onRestore: (id: string) => void;
  onHardDelete: (service: ServiceDto) => void;
  restorePending: boolean;
}

export function DeletedServiceCard({
  service,
  onRestore,
  onHardDelete,
  restorePending,
}: DeletedServiceCardProps) {
  return (
    <Card className={cn('border-dashed opacity-70', 'card-hover')}>
      <CardHeader className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            {service.logoUrl ? (
              <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded grayscale">
                <Image src={service.logoUrl} alt="" fill className="object-cover" sizes="24px" />
              </div>
            ) : (
              <div className="bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold">
                {getInitial(service.name)}
              </div>
            )}
            {service.name}
            <Badge variant="outline" className="text-xs">
              {service.category}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Archivé
            </Badge>
            {service.deletedAt && (
              <span className="text-muted-foreground text-xs">
                le {new Date(service.deletedAt).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 cursor-pointer gap-1.5"
              onClick={() => onRestore(service.id)}
              disabled={restorePending}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurer
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive h-8 w-8 cursor-pointer"
              onClick={() => onHardDelete(service)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
