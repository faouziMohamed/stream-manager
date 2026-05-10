'use client';

import { useEffect, useRef, useState } from 'react';
import type { ElementType } from 'react';
import Link from 'next/link';
import { ArrowRight, MessageCircle, ShieldCheck, Clock, Smile } from 'lucide-react';
import { ROUTES } from '@/lib/config/routes';

function useCountUp(target: number, active: boolean, duration = 1600) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    let raf: number;
    function step(ts: number) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);
  return value;
}

const FINAL_STATS = [
  {
    icon: Clock,
    value: 24,
    suffix: 'h',
    label: "Délai d'activation max",
    color: 'var(--sm-gold)',
  },
  {
    icon: ShieldCheck,
    value: 100,
    suffix: '%',
    label: 'Légal & sans risque',
    color: 'var(--sm-indigo)',
  },
  {
    icon: Smile,
    value: 7,
    suffix: 'j/7',
    label: 'Support disponible',
    color: 'var(--sm-coral)',
  },
] as const;

function StatCard({
  icon: Icon,
  value,
  suffix,
  label,
  color,
  active,
}: {
  icon: ElementType;
  value: number;
  suffix: string;
  label: string;
  color: string;
  active: boolean;
}) {
  const count = useCountUp(value, active, 1600);
  return (
    <div
      className="card-hover flex items-center gap-3 rounded-2xl border px-5 py-3 transition-all duration-200"
      style={{
        background: 'var(--sm-surface2)',
        borderColor: 'var(--sm-border2)',
      }}
    >
      <Icon className="h-4 w-4 shrink-0" style={{ color }} />
      <div>
        <p
          className="font-display text-lg leading-none font-extrabold tabular-nums"
          style={{ color }}
        >
          {count}
          {suffix}
        </p>
        <p className="mt-0.5 text-[11px]" style={{ color: 'var(--sm-muted)' }}>
          {label}
        </p>
      </div>
    </div>
  );
}

export function CtaSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActive(true);
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="sm-grain card-hover relative overflow-hidden rounded-3xl transition-all duration-200"
      style={{
        background:
          'radial-gradient(ellipse 100% 120% at 50% 100%, var(--sm-cta-glow) 0%, var(--sm-void) 65%)',
        border: '1px solid var(--sm-border)',
      }}
    >
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--sm-hero-grid) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Coral bloom */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 blur-3xl"
        aria-hidden="true"
        style={{ background: 'oklch(0.62 0.22 28 / 0.15)' }}
      />

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-20 sm:py-28">
        {/* Watermark number */}
        <div
          className="font-display pointer-events-none text-center font-extrabold select-none"
          style={{
            fontSize: 'clamp(6rem,20vw,11rem)',
            lineHeight: 1,
            color: 'oklch(1 0 0 / 0.03)',
          }}
          aria-hidden="true"
        >
          24h
        </div>

        {/* Headline */}
        <div className="-mt-8 space-y-5 text-center">
          <h2
            className="font-display leading-tight font-extrabold"
            style={{
              fontSize: 'clamp(2rem,5vw,3.5rem)',
              color: 'var(--sm-fg)',
            }}
          >
            Votre accès activé en{' '}
            <span style={{ color: 'var(--sm-coral)' }}>moins de 24 heures.</span>
          </h2>
          <p
            className="mx-auto max-w-md text-sm leading-relaxed sm:text-base"
            style={{ color: 'var(--sm-muted)' }}
          >
            Sans engagement, sans renouvellement automatique. Commandez aujourd&apos;hui et profitez
            de vos plateformes dès ce soir.
          </p>
        </div>

        {/* Animated stats row */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {FINAL_STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} active={active} />
          ))}
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={ROUTES.contact} className="sm-btn-coral">
            <MessageCircle className="h-4 w-4" />
            Commander maintenant
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a href="#catalogue" className="sm-btn-ghost">
            Explorer le catalogue
          </a>
        </div>

        {/* Trust line */}
        <div
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs"
          style={{ color: 'var(--sm-muted)' }}
        >
          {['✓ 100% légal', '✓ Sans engagement', '✓ Support réactif 7j/7'].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
