'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils/helpers';
import { ROUTES } from '@/lib/config/routes';
import type { Service } from './services-section-types';

export function ServiceDialog({
  service,
  open,
  onClose,
}: {
  service: Service;
  open: boolean;
  onClose: () => void;
}) {
  const sorted = [...service.plans].toSorted((a, b) => a.durationMonths - b.durationMonths);
  const best =
    sorted.length > 1
      ? sorted.reduce((b, p) =>
          Number(p.price) / p.durationMonths < Number(b.price) / b.durationMonths ? p : b
        )
      : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-md overflow-hidden border-0 p-0"
        style={{ background: 'var(--sm-surface)' }}
      >
        <div
          className="relative flex h-28 items-end px-6 pb-4"
          style={{
            background: 'var(--sm-surface2)',
            borderBottom: '1px solid var(--sm-border)',
          }}
        >
          <div className="flex items-end gap-4">
            <div
              className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border"
              style={{ borderColor: 'var(--sm-border2)' }}
            >
              {service.logoUrl ? (
                <Image
                  src={service.logoUrl}
                  alt={service.name}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="font-display flex h-full w-full items-center justify-center text-2xl font-bold"
                  style={{
                    background: 'var(--sm-coral-s)',
                    color: 'var(--sm-coral)',
                  }}
                >
                  {service.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p
                className="mb-0.5 text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: 'var(--sm-coral)' }}
              >
                {service.category}
              </p>
              <h2 className="font-display text-xl font-bold" style={{ color: 'var(--sm-fg)' }}>
                {service.name}
              </h2>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          {service.description && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--sm-muted)' }}>
              {service.description}
            </p>
          )}

          {sorted.length > 0 ? (
            <div className="space-y-3">
              <p
                className="text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: 'var(--sm-muted)' }}
              >
                Formules disponibles
              </p>
              <div className="grid grid-cols-2 gap-2">
                {sorted.map((plan) => {
                  const ppm = Number(plan.price) / plan.durationMonths;
                  const isBest = best?.id === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className="relative rounded-xl border p-3 text-center"
                      style={{
                        background: isBest ? 'var(--sm-coral-s)' : 'var(--sm-surface2)',
                        borderColor: isBest ? 'var(--sm-coral-b)' : 'var(--sm-border)',
                      }}
                    >
                      {isBest && (
                        <span
                          className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-bold whitespace-nowrap"
                          style={{
                            background: 'var(--sm-coral)',
                            color: 'var(--sm-coral-fg)',
                          }}
                        >
                          Meilleur rapport
                        </span>
                      )}
                      <p className="mb-1 text-xs" style={{ color: 'var(--sm-muted)' }}>
                        {plan.durationMonths} mois
                      </p>
                      <p
                        className="font-display text-lg font-extrabold tabular-nums"
                        style={{
                          color: isBest ? 'var(--sm-coral)' : 'var(--sm-fg)',
                        }}
                      >
                        {formatCurrency(Number(plan.price), plan.currencyCode)}
                      </p>
                      <p className="text-[10px] tabular-nums" style={{ color: 'var(--sm-muted)' }}>
                        {formatCurrency(ppm, plan.currencyCode)}/mois
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm italic" style={{ color: 'var(--sm-muted)' }}>
              Tarifs disponibles sur demande.
            </p>
          )}

          <Link
            href={ROUTES.contact}
            className="sm-btn-coral w-full justify-center"
            onClick={onClose}
          >
            Souscrire à {service.name}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
