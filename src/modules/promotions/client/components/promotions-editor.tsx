'use client';

import { useState } from 'react';
import {
  CalendarClock,
  ChevronDown,
  ChevronRight,
  EyeOff,
  Package,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/console/confirm-dialog';
import { toDateTimeString } from '@/lib/utils/date-utils';
import {
  useCreatePromotion,
  useDeletePromotion,
  usePromotions,
  useUpdatePromotion,
} from '@/lib/hooks/queries/use-promotions.queries';
import { useServices } from '@/lib/hooks/queries/use-services.queries';
import { PromotionDialog } from './promotions-promotion-dialog';
import type { PromotionForm } from './promotions-dialog-types';
import type { PromotionDto } from '@/lib/graphql/operations/promotions.operations';
import { PromotionPlansTable } from './promotions-plans-table';

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function promoStatus(promo: PromotionDto) {
  if (!promo.isActive) return { label: 'Inactive', variant: 'secondary' as const };
  if (promo.isExpired) return { label: 'Expirée', variant: 'destructive' as const };
  return { label: 'Active', variant: 'default' as const };
}

interface Props {
  initialData?: PromotionDto[];
  defaultCurrency?: string;
}

export function PromotionsEditor({ initialData, defaultCurrency = 'MAD' }: Props) {
  const { data: promotions = [] } = usePromotions(initialData);
  const { data: allServices = [] } = useServices();
  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();
  const deletePromotion = useDeletePromotion();
  const [dialog, setDialog] = useState<{ open: boolean; promo?: PromotionDto }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handlePromotionSubmit = async (data: PromotionForm) => {
    const startsAt = data.startsAt ? toDateTimeString(data.startsAt) : undefined;
    const expiresAt = data.expiresAt ? toDateTimeString(data.expiresAt) : undefined;
    await (dialog.promo
      ? updatePromotion.mutateAsync({
          id: dialog.promo.id,
          input: {
            name: data.name,
            description: data.description,
            serviceIds: data.serviceIds,
            startsAt,
            expiresAt,
            showOnHomepage: data.showOnHomepage,
          },
        })
      : createPromotion.mutateAsync({
          name: data.name,
          description: data.description,
          serviceIds: data.serviceMode === 'existing' ? data.serviceIds : [],
          newServiceName: data.serviceMode === 'new' ? data.newServiceName : undefined,
          newServiceCategory: data.serviceMode === 'new' ? data.newServiceCategory : undefined,
          startsAt,
          expiresAt,
          showOnHomepage: data.showOnHomepage,
        }));
    setDialog({ open: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Promotions</h1>
          <p className="text-muted-foreground text-sm">
            Offres groupées combinant plusieurs services
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true })}>
          <Plus className="mr-2 h-4 w-4" /> Nouvelle promotion
        </Button>
      </div>

      {promotions.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center">
            Aucune promotion. Créez-en une pour commencer.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {promotions.map((promo) => {
            const status = promoStatus(promo);
            const isExpanded = expandedId === promo.id;
            return (
              <Card
                key={promo.id}
                className={`card-hover ${promo.isExpired || !promo.isActive ? 'opacity-60' : ''}`}
              >
                <CardHeader className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      className="hover:text-primary flex min-w-0 flex-1 items-center gap-2 text-left font-semibold transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : promo.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
                      )}
                      <Package className="text-primary h-4 w-4 shrink-0" />
                      <span className="truncate">{promo.name}</span>
                      <Badge variant={status.variant} className="shrink-0 text-xs">
                        {status.label}
                      </Badge>
                      {promo.showOnHomepage === false && (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground shrink-0 gap-1 text-xs"
                        >
                          <EyeOff className="h-3 w-3" /> Masqué
                        </Badge>
                      )}
                    </button>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setDialog({ open: true, promo })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive h-8 w-8"
                        onClick={() => setDeleteTarget(promo.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="ml-10 flex flex-wrap items-center gap-3">
                    {promo.description && (
                      <p className="text-muted-foreground text-xs">{promo.description}</p>
                    )}
                    {promo.services && promo.services.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {promo.services.map((s) => (
                          <Badge key={s.id} variant="outline" className="text-xs">
                            {s.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {(promo.startsAt || promo.expiresAt) && (
                      <div className="text-muted-foreground flex items-center gap-1 text-xs">
                        <CalendarClock className="h-3 w-3" />
                        {promo.startsAt && <span>Début: {formatDate(promo.startsAt)}</span>}
                        {promo.startsAt && promo.expiresAt && <span>·</span>}
                        {promo.expiresAt && (
                          <span className={promo.isExpired ? 'text-destructive' : ''}>
                            Expire: {formatDate(promo.expiresAt)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="px-4 pt-0 pb-4">
                    <PromotionPlansTable promotionId={promo.id} currency={defaultCurrency} />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <PromotionDialog
        open={dialog.open}
        promotion={dialog.promo ?? null}
        allServices={allServices}
        onOpenChange={(o) => setDialog({ open: o })}
        onSubmit={handlePromotionSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Supprimer la promotion"
        description="Toutes les formules associées seront supprimées."
        onConfirm={async () => {
          if (deleteTarget) {
            await deletePromotion.mutateAsync(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        loading={deletePromotion.isPending}
      />
    </div>
  );
}
