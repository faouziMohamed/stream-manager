'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Layers, Check } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils/helpers';
import { ROUTES } from '@/lib/config/routes';
import type { Promo } from '@/modules/promotions/client/components/public/promotions-section-types';

export function PromoDialog({
  promo,
  open,
  onClose,
}: {
  promo: Promo;
  open: boolean;
  onClose: () => void;
}) {
  const sorted = [...promo.plans].toSorted((a, b) => a.durationMonths - b.durationMonths);
  const best =
    sorted.length > 1
      ? sorted.reduce((b, p) =>
          Number(p.price) / p.durationMonths < Number(b.price) / b.durationMonths ? p : b
        )
      : (sorted[0] ?? null);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-lg overflow-hidden border-0 p-0"
        style={{ background: 'var(--sm-surface)' }}
      >
        <div
          className="relative px-6 pt-6 pb-5"
          style={{
            background: 'var(--sm-surface2)',
            borderBottom: '1px solid var(--sm-border)',
          }}
        >
          <div
            className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase"
            style={{
              background: 'var(--sm-gold-s)',
              border: '1px solid var(--sm-gold-b)',
              color: 'var(--sm-gold)',
            }}
          >
            <Layers className="h-3 w-3" /> Pack groupé
          </div>
          <h2
            className="font-display text-2xl leading-tight font-extrabold"
            style={{ color: 'var(--sm-fg)' }}
          >
            {promo.name}
          </h2>
          {promo.description && (
            <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--sm-muted)' }}>
              {promo.description}
            </p>
          )}
        </div>

        <div className="space-y-5 p-6">
          {promo.services.length > 0 && (
            <div className="space-y-2">
              <p
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: 'var(--sm-muted)' }}
              >
                Services inclus
              </p>
              <div className="flex flex-wrap gap-2">
                {promo.services.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-1.5 rounded-full border py-1 pr-3 pl-1 text-xs"
                    style={{
                      background: 'var(--sm-surface2)',
                      borderColor: 'var(--sm-border2)',
                      color: 'var(--sm-fg)',
                    }}
                  >
                    {s.logoUrl ? (
                      <Image
                        src={s.logoUrl}
                        alt={s.name}
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                        style={{
                          background: 'var(--sm-gold-s)',
                          color: 'var(--sm-gold)',
                        }}
                      >
                        {s.name.charAt(0)}
                      </div>
                    )}
                    {s.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {sorted.length > 0 && (
            <div className="space-y-2">
              <p
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: 'var(--sm-muted)' }}
              >
                Formules disponibles
              </p>
              <div className="space-y-2">
                {sorted.map((plan) => {
                  const ppm = Number(plan.price) / plan.durationMonths;
                  const isBest = best?.id === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className="relative flex items-center justify-between rounded-xl border px-4 py-3"
                      style={{
                        background: isBest ? 'var(--sm-gold-s)' : 'var(--sm-surface2)',
                        borderColor: isBest ? 'var(--sm-gold-b)' : 'var(--sm-border)',
                      }}
                    >
                      {isBest && (
                        <span
                          className="absolute -top-2.5 right-3 rounded-full px-2 py-0.5 text-[9px] font-bold"
                          style={{
                            background: 'var(--sm-gold)',
                            color: 'var(--sm-void)',
                          }}
                        >
                          Meilleur rapport
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <Check
                          className="h-3.5 w-3.5"
                          style={{
                            color: isBest ? 'var(--sm-gold)' : 'var(--sm-muted)',
                          }}
                        />
                        <span className="text-sm font-medium" style={{ color: 'var(--sm-fg)' }}>
                          {plan.durationMonths} mois
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className="font-display text-base font-bold tabular-nums"
                          style={{
                            color: isBest ? 'var(--sm-gold)' : 'var(--sm-fg)',
                          }}
                        >
                          {formatCurrency(Number(plan.price), plan.currencyCode)}
                        </span>
                        <span
                          className="ml-2 text-xs tabular-nums"
                          style={{ color: 'var(--sm-muted)' }}
                        >
                          {formatCurrency(ppm, plan.currencyCode)}/mois
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {promo.expiresAt && (
            <p className="text-xs" style={{ color: 'var(--sm-muted)' }}>
              ⏳ Offre disponible jusqu&apos;au{' '}
              {new Date(promo.expiresAt).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}

          <Link
            href={ROUTES.contact}
            className="sm-btn-coral w-full justify-center"
            onClick={onClose}
          >
            Commander ce pack
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
