'use client';

import Image from 'next/image';
import { ArrowRight, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/helpers';
import type { Service } from './services-section-types';

export function ServiceCard({ service, onClick }: { service: Service; onClick: () => void }) {
  const lowestPlan =
    service.plans.length > 0
      ? service.plans.reduce((a, b) => (Number(a.price) < Number(b.price) ? a : b))
      : null;

  const cheapestPerMonth = lowestPlan ? Number(lowestPlan.price) / lowestPlan.durationMonths : null;

  const hasBestValue = service.plans.length > 1;

  return (
    <button
      type="button"
      onClick={onClick}
      className="sm-card group card-hover relative flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: 'var(--sm-surface)',
        borderColor: 'var(--sm-border)',
      }}
    >
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: '1 / 1',
          background: 'var(--sm-surface2)',
        }}
      >
        {service.logoUrl ? (
          <Image
            src={service.logoUrl}
            alt={service.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-display text-5xl font-extrabold"
              style={{ color: 'oklch(1 0 0 / 0.12)' }}
            >
              {service.name.charAt(0)}
            </span>
          </div>
        )}

        {service.plans.length > 0 && (
          <div
            className="absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              background: 'var(--sm-void)',
              color: 'var(--sm-muted)',
              border: '1px solid var(--sm-border2)',
            }}
          >
            {service.plans.length} formule{service.plans.length > 1 ? 's' : ''}
          </div>
        )}

        {hasBestValue && (
          <div
            className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              background: 'var(--sm-coral)',
              color: 'var(--sm-coral-fg)',
            }}
          >
            <Star className="h-2.5 w-2.5 fill-current" />
            Multi-offres
          </div>
        )}
      </div>

      <div className="space-y-1.5 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              className="font-display truncate text-sm leading-tight font-bold"
              style={{ color: 'var(--sm-fg)', maxWidth: '120px' }}
            >
              {service.name}
            </p>
            <p
              className="mt-0.5 truncate text-[10px] font-medium"
              style={{ color: 'var(--sm-muted)' }}
            >
              {service.category}
            </p>
          </div>
          {cheapestPerMonth && (
            <div className="shrink-0 text-right">
              <p className="text-[9px]" style={{ color: 'var(--sm-muted)' }}>
                Dès
              </p>
              <p
                className="font-display text-sm leading-none font-bold tabular-nums"
                style={{ color: 'var(--sm-coral)' }}
              >
                {formatCurrency(cheapestPerMonth, lowestPlan!.currencyCode)}
                <span className="text-[9px] font-normal">/mois</span>
              </p>
            </div>
          )}
        </div>

        <div
          className="flex items-center justify-between border-t pt-1.5 text-[10px] font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ borderColor: 'var(--sm-border)', color: 'var(--sm-coral)' }}
        >
          <span>Voir les détails</span>
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </button>
  );
}
