'use client';

import Image from 'next/image';
import { ArrowRight, Layers } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/helpers';
import type { Promo } from '@/modules/promotions/client/components/public/promotions-section-types';

export function PromoCard({ promo, onClick }: { promo: Promo; onClick: () => void }) {
  const lowestPlan =
    promo.plans.length > 0
      ? promo.plans.reduce((a, b) => (Number(a.price) < Number(b.price) ? a : b))
      : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="sm-card group card-hover w-full cursor-pointer overflow-hidden rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: 'var(--sm-surface)',
        borderColor: 'var(--sm-border)',
      }}
    >
      <div
        className="h-0.5 w-full"
        style={{
          background: 'linear-gradient(90deg, var(--sm-gold), var(--sm-coral))',
        }}
      />
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase"
              style={{
                background: 'var(--sm-gold-s)',
                borderColor: 'var(--sm-gold-b)',
                color: 'var(--sm-gold)',
              }}
            >
              <Layers className="h-2.5 w-2.5" /> Pack
            </div>
            <h3
              className="font-display text-lg leading-tight font-extrabold"
              style={{ color: 'var(--sm-fg)' }}
            >
              {promo.name}
            </h3>
          </div>
          {lowestPlan && (
            <div className="shrink-0 text-right">
              <p className="text-[10px]" style={{ color: 'var(--sm-muted)' }}>
                Dès
              </p>
              <p
                className="font-display text-xl font-extrabold tabular-nums"
                style={{ color: 'var(--sm-gold)' }}
              >
                {formatCurrency(Number(lowestPlan.price), lowestPlan.currencyCode)}
              </p>
            </div>
          )}
        </div>

        {promo.services.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            {promo.services.slice(0, 6).map((s, idx) => (
              <div
                key={s.id}
                className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border text-[10px] font-bold"
                style={{
                  background: 'var(--sm-surface2)',
                  borderColor: 'var(--sm-border2)',
                  color: 'var(--sm-muted)',
                  marginLeft: idx > 0 ? '-6px' : '0',
                  zIndex: 10 - idx,
                  position: 'relative',
                }}
              >
                {s.logoUrl ? (
                  <Image
                    src={s.logoUrl}
                    alt={s.name}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  s.name.charAt(0)
                )}
              </div>
            ))}
            {promo.services.length > 6 && (
              <span className="ml-1 text-xs" style={{ color: 'var(--sm-muted)' }}>
                +{promo.services.length - 6}
              </span>
            )}
          </div>
        )}

        {promo.description && (
          <p className="line-clamp-2 text-xs leading-relaxed" style={{ color: 'var(--sm-muted)' }}>
            {promo.description}
          </p>
        )}

        <div
          className="flex items-center justify-between border-t pt-2 text-xs font-semibold"
          style={{ borderColor: 'var(--sm-border)', color: 'var(--sm-coral)' }}
        >
          <span>Voir les formules</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
}
