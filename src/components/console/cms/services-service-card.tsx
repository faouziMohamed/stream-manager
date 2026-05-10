"use client";

import {
  ChevronDown,
  ChevronRight,
  EyeOff,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PlansTable } from "./services-plans-manager";
import type { ServiceDto } from "@/lib/graphql/operations/services.operations";

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
    <Card className={service.isActive ? "" : "opacity-60"}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-2 font-semibold hover:text-primary transition-colors text-left cursor-pointer"
            onClick={() => onToggleExpand(service.id)}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {service.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={service.logoUrl}
                alt=""
                className="h-6 w-6 rounded object-cover shrink-0 bg-muted/40"
              />
            )}
            {service.name}
            <Badge variant="outline" className="text-xs">
              {service.category}
            </Badge>
            {!service.isActive && <Badge variant="secondary">Inactif</Badge>}
            {service.showOnHomepage === false && (
              <Badge
                variant="outline"
                className="text-xs text-muted-foreground gap-1"
              >
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
              className="h-8 w-8 text-destructive cursor-pointer"
              onClick={() => onDelete(service)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {service.description && (
          <p className="text-xs text-muted-foreground ml-6">
            {service.description}
          </p>
        )}
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 pb-4 px-4">
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
    <Card className="opacity-70 border-dashed">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            {service.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={service.logoUrl}
                alt=""
                className="h-6 w-6 rounded object-cover shrink-0 bg-muted/40 grayscale"
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
              <span className="text-xs text-muted-foreground">
                le {new Date(service.deletedAt).toLocaleDateString("fr-FR")}
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
              className="h-8 w-8 text-destructive cursor-pointer"
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
