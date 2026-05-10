'use client';

import { useEffect, useRef, useState } from 'react';
import type { Promo } from '@/modules/promotions/client/components/public/promotions-section-types';
import { PromoDialog } from '@/modules/promotions/client/components/public/promotions-promo-dialog';
import { FeaturedPromoCard } from '@/modules/promotions/client/components/public/promotions-featured-card';
import { PromoCard } from '@/modules/promotions/client/components/public/promotions-card';

// ─── Section ───────────────────────────────────────────────────────────────

function useSectionReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, visible] as const;
}

export function PromotionsSection({ promos }: { promos: Promo[] }) {
  const [selected, setSelected] = useState<Promo | null>(null);
  const [sectionRef, sectionVisible] = useSectionReveal();

  if (promos.length === 0) return null;

  const [featured, ...rest] = promos;

  return (
    <section ref={sectionRef} className="space-y-5" id="packs">
      {/* Section header */}
      <div
        className="sm-reveal sm-fade-up"
        style={{
          transitionDelay: '0ms',
          ...(sectionVisible ? { opacity: 1, transform: 'none' } : {}),
        }}
      >
        <p
          className="mb-1 text-[10px] font-semibold tracking-widest uppercase"
          style={{ color: 'var(--sm-gold)' }}
        >
          Offres groupées
        </p>
        <h2
          className="font-display text-3xl font-extrabold sm:text-4xl"
          style={{ color: 'var(--sm-fg)' }}
        >
          Les packs du moment
        </h2>
      </div>

      {/* Featured card */}
      <div
        className="sm-reveal"
        style={{
          transitionDelay: '80ms',
          ...(sectionVisible ? { opacity: 1, transform: 'none' } : {}),
        }}
      >
        <FeaturedPromoCard promo={featured} onClick={() => setSelected(featured)} />
      </div>

      {/* Secondary cards */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {rest.map((promo, i) => (
            <div
              key={promo.id}
              className="sm-reveal"
              style={{
                transitionDelay: `${160 + i * 80}ms`,
                ...(sectionVisible ? { opacity: 1, transform: 'none' } : {}),
              }}
            >
              <PromoCard promo={promo} onClick={() => setSelected(promo)} />
            </div>
          ))}
        </div>
      )}

      {selected && (
        <PromoDialog promo={selected} open={!!selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
