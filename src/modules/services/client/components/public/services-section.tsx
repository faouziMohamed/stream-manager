'use client';

import { useEffect, useRef, useState } from 'react';
import type { Service } from './services-section-types';
import { ServiceDialog } from './services-service-dialog';
import { ServiceCard } from './services-service-card';
import { CategoryTabs } from './services-category-tabs';

export function ServicesSection({ services }: { services: Service[] }) {
  const [selected, setSelected] = useState<Service | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (services.length === 0) return null;

  const categories = Array.from(new Set(services.map((s) => s.category))).toSorted();
  const filtered =
    activeCategory === 'all' ? services : services.filter((s) => s.category === activeCategory);

  return (
    <section ref={sectionRef} className="space-y-6" id="catalogue">
      {/* Header row */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div
          className="sm-reveal sm-fade-up"
          style={{ ...(visible ? { opacity: 1, transform: 'none' } : {}) }}
        >
          <p
            className="mb-1 text-[10px] font-semibold tracking-widest uppercase"
            style={{ color: 'var(--sm-coral)' }}
          >
            Services individuels
          </p>
          <h2
            className="font-display text-3xl font-extrabold sm:text-4xl"
            style={{ color: 'var(--sm-fg)' }}
          >
            Le catalogue complet
          </h2>
        </div>

        {categories.length > 1 && (
          <div
            className="sm-reveal"
            style={{
              transitionDelay: '80ms',
              ...(visible ? { opacity: 1, transform: 'none' } : {}),
            }}
          >
            <CategoryTabs
              categories={categories}
              active={activeCategory}
              onChange={setActiveCategory}
            />
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filtered.map((service, i) => (
          <div
            key={service.id}
            className="sm-reveal"
            style={{
              transitionDelay: `${i * 40}ms`,
              ...(visible ? { opacity: 1, transform: 'none' } : {}),
            }}
          >
            <ServiceCard service={service} onClick={() => setSelected(service)} />
          </div>
        ))}
      </div>

      {selected && (
        <ServiceDialog service={selected} open={!!selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
