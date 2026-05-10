'use client';

import Image from 'next/image';
import { ArrowRight, Layers } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/helpers';
import type { Promo } from '@/modules/promotions/client/components/public/promotions-section-types';

export function FeaturedPromoCard({ promo, onClick }: { promo: Promo; onClick: () => void }) {
  const lowestPlan =
    promo.plans.length > 0
      ? promo.plans.reduce((a, b) => (Number(a.price) < Number(b.price) ? a : b))
      : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group card-hover relative w-full cursor-pointer overflow-hidden rounded-3xl border text-left transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: 'var(--sm-surface)',
        borderColor: 'var(--sm-gold-b)',
        boxShadow: '0 0 0 1px var(--sm-gold-b), 0 24px 64px oklch(0.76 0.16 62 / 0.06)',
      }}
    >
      <div
        className="absolute top-0 right-0 left-0 h-1"
        style={{
          background: 'linear-gradient(90deg, var(--sm-gold), var(--sm-coral))',
        }}
      />

      <div className="flex flex-col items-start gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="flex-1 space-y-3">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-widest uppercase"
            style={{
              background: 'var(--sm-gold-s)',
              border: '1px solid var(--sm-gold-b)',
              color: 'var(--sm-gold)',
            }}
          >
            <Layers className="h-3 w-3" /> Pack vedette
          </div>
          <h3
            className="font-display leading-tight font-extrabold"
            style={{
              fontSize: 'clamp(1.5rem,3vw,2.25rem)',
              color: 'var(--sm-fg)',
            }}
          >
            {promo.name}
          </h3>
          {promo.description && (
            <p className="max-w-sm text-sm leading-relaxed" style={{ color: 'var(--sm-muted)' }}>
              {promo.description}
            </p>
          )}

          {promo.services.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1">
              {promo.services.slice(0, 8).map((s, idx) => (
                <div
                  key={s.id}
                  className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border text-xs font-bold"
                  style={{
                    background: 'var(--sm-surface2)',
                    borderColor: 'var(--sm-border2)',
                    color: 'var(--sm-muted)',
                    marginLeft: idx > 0 ? '-6px' : '0',
                    zIndex: 20 - idx,
                    position: 'relative',
                  }}
                >
                  {s.logoUrl ? (
                    <Image
                      src={s.logoUrl}
                      alt={s.name}
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    s.name.charAt(0)
                  )}
                </div>
              ))}
              {promo.services.length > 8 && (
                <span className="ml-1 text-xs" style={{ color: 'var(--sm-muted)' }}>
                  +{promo.services.length - 8}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
          {lowestPlan && (
            <div className="text-right">
              <p className="text-xs" style={{ color: 'var(--sm-muted)' }}>
                À partir de
              </p>
              <p
                className="font-display font-extrabold tabular-nums"
                style={{
                  fontSize: 'clamp(2rem,4vw,3rem)',
                  color: 'var(--sm-gold)',
                  lineHeight: 1,
                }}
              >
                {formatCurrency(Number(lowestPlan.price), lowestPlan.currencyCode)}
              </p>
            </div>
          )}
          <div
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 group-hover:scale-105"
            style={{ background: 'var(--sm-gold)', color: 'var(--sm-void)' }}
          >
            Voir les formules
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </button>
  );
}
