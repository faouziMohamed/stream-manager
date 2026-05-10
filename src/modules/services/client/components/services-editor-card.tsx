'use client';

import { ChevronDown, ChevronRight, EyeOff, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PlansTable } from './services-plans-manager';
import { cn } from '@/lib/utils/helpers';
import type { ServiceDto } from '@/lib/graphql/operations/services.operations';

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
  return (
    <Card className={cn(service.isActive ? '' : 'opacity-60', 'card-hover')}>
      <CardHeader className="px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="hover:text-primary flex cursor-pointer items-center gap-2 text-left font-semibold transition-colors"
            onClick={() => onToggleExpand(service.id)}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {service.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={service.logoUrl}
                alt=""
                className="bg-muted/40 h-6 w-6 shrink-0 rounded object-cover"
              />
            )}
            {service.name}
            <Badge variant="outline" className="text-xs">
              {service.category}
            </Badge>
            {!service.isActive && <Badge variant="secondary">Inactif</Badge>}
            {service.showOnHomepage === false && (
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
        {service.description && (
          <p className="text-muted-foreground ml-6 text-xs">{service.description}</p>
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
            {service.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={service.logoUrl}
                alt=""
                className="bg-muted/40 h-6 w-6 shrink-0 rounded object-cover grayscale"
              />
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
