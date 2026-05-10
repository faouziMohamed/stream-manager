'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MessageCircle, Shield, Zap, Clock } from 'lucide-react';
import { ROUTES } from '@/lib/config/routes';
import type { ServiceItem } from '@/components/website/home/hero-logo-mosaic';
import { LogoMosaic } from '@/components/website/home/hero-logo-mosaic';
import { StatPill } from '@/components/website/home/hero-stat-pill';

export function HeroSection({ services }: { services: ServiceItem[] }) {
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsActive, setStatsActive] = useState(false);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsActive(true);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const serviceCountLabel =
    services.length > 0
      ? `${services.length} plateforme${
          services.length > 1 ? 's' : ''
        } disponible${services.length > 1 ? 's' : ''}`
      : 'vos plateformes préférées';

  return (
    <section
      className="sm-grain relative overflow-hidden"
      style={{ background: 'var(--sm-void)', minHeight: '100svh' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(var(--sm-hero-grid) 1px, transparent 1px), linear-gradient(90deg, var(--sm-hero-grid) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div
        className="pointer-events-none absolute top-0 right-0 blur-[120px]"
        aria-hidden="true"
        style={{
          width: 'clamp(300px, 100vw, 700px)',
          height: 'clamp(250px, 80vw, 500px)',
          background: 'oklch(0.62 0.22 28 / 0.07)',
          transform: 'translate(20%, -20%)',
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 blur-[120px]"
        aria-hidden="true"
        style={{
          width: 'clamp(250px, 90vw, 500px)',
          height: 'clamp(200px, 70vw, 400px)',
          background: 'oklch(0.58 0.18 255 / 0.07)',
          transform: 'translate(-20%, 20%)',
        }}
      />

      <div className="xs:px-4 xs:py-20 relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-center px-3 py-16 sm:px-6 sm:py-28 lg:py-36">
        <div className="grid items-center gap-12 lg:grid-cols-5 lg:gap-6">
          <div className="space-y-8 lg:col-span-3">
            <div
              className="sm-fade-in xs:px-4 xs:py-1.5 xs:text-xs inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold tracking-widest uppercase"
              style={{
                background: 'var(--sm-coral-s)',
                border: '1px solid var(--sm-coral-b)',
                color: 'var(--sm-coral)',
                animationDelay: '0ms',
              }}
            >
              <span className="xs:h-1.5 xs:w-1.5 h-1 w-1 animate-pulse rounded-full bg-current" />
              {serviceCountLabel}
            </div>

            <div style={{ maxWidth: '580px' }}>
              <h1 className="font-display leading-[0.92] font-extrabold tracking-tight">
                <span
                  className="sm-fade-up block"
                  style={{
                    fontSize: 'clamp(1.75rem,5vw,5.5rem)',
                    color: 'var(--sm-fg)',
                    animationDelay: '80ms',
                  }}
                >
                  Streamez.
                </span>
                <span
                  className="sm-fade-up block"
                  style={{
                    fontSize: 'clamp(1.75rem,5vw,5.5rem)',
                    color: 'var(--sm-fg)',
                    animationDelay: '160ms',
                  }}
                >
                  Profitez.
                </span>
                <span
                  className="sm-fade-up block"
                  style={{
                    fontSize: 'clamp(1.25rem,4vw,4rem)',
                    color: 'var(--sm-coral)',
                    animationDelay: '240ms',
                  }}
                >
                  À prix imbattable.
                </span>
              </h1>
            </div>

            <p
              className="sm-fade-up xs:text-base max-w-md text-xs leading-relaxed sm:text-lg"
              style={{ color: 'var(--sm-muted)', animationDelay: '320ms' }}
            >
              Netflix, Shahid, Disney+ et vos plateformes préférées — sans engagement, activés en
              moins de 24h.
            </p>

            <div ref={statsRef} className="xs:gap-3 flex flex-wrap gap-2">
              <StatPill
                icon={Zap}
                value={services.length > 0 ? services.length : 20}
                suffix="+"
                label="Services disponibles"
                color="var(--sm-coral)"
                bg="var(--sm-coral-s)"
                border="var(--sm-coral-b)"
                active={statsActive}
                delay={0}
              />
              <StatPill
                icon={Clock}
                value={24}
                suffix="h"
                label="Délai d'activation"
                color="var(--sm-gold)"
                bg="var(--sm-gold-s)"
                border="var(--sm-gold-b)"
                active={statsActive}
                delay={100}
              />
              <StatPill
                icon={Shield}
                value={100}
                suffix="%"
                label="Légal & sécurisé"
                color="var(--sm-indigo)"
                bg="var(--sm-indigo-s)"
                border="oklch(0.58 0.18 255 / 0.28)"
                active={statsActive}
                delay={200}
              />
            </div>

            <div
              className="sm-fade-up xs:flex-row xs:gap-3 flex flex-col gap-2"
              style={{ animationDelay: '480ms' }}
            >
              <Link href={ROUTES.contact} className="sm-btn-coral xs:text-sm text-xs">
                <MessageCircle className="xs:h-4 xs:w-4 h-3 w-3" />
                <span className="xs:inline hidden">Commander maintenant</span>
                <span className="xs:hidden inline">Commander</span>
                <ArrowRight className="xs:h-4 xs:w-4 h-3 w-3" />
              </Link>
              <a href="#catalogue" className="sm-btn-ghost xs:text-sm text-xs">
                Voir le catalogue
              </a>
            </div>
          </div>

          <div
            className="sm-fade-in hidden items-center justify-center lg:col-span-2 lg:flex"
            style={{ animationDelay: '560ms' }}
          >
            <LogoMosaic services={services} />
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-32"
        style={{
          background: 'linear-gradient(to bottom, transparent, var(--background))',
        }}
        aria-hidden="true"
      />
    </section>
  );
}
