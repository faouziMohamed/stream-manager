'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, CreditCard, Zap } from 'lucide-react';

const STEPS = [
  {
    n: '01',
    icon: MessageCircle,
    title: 'Choisissez',
    body: 'Parcourez le catalogue. Cliquez sur un service ou un pack pour voir les formules et les tarifs détaillés.',
    color: 'var(--sm-coral)',
    bg: 'var(--sm-coral-s)',
    border: 'var(--sm-coral-b)',
  },
  {
    n: '02',
    icon: CreditCard,
    title: 'Payez',
    body: 'Contactez-nous, confirmez votre commande et effectuez le paiement par virement ou CIH Money. Zéro frais cachés.',
    color: 'var(--sm-indigo)',
    bg: 'var(--sm-indigo-s)',
    border: 'oklch(0.58 0.18 255 / 0.28)',
  },
  {
    n: '03',
    icon: Zap,
    title: 'Accédez',
    body: "Vos identifiants sont activés dans les 24h. En pratique, c'est souvent bien plus rapide — parfois dans l'heure.",
    color: 'var(--sm-gold)',
    bg: 'var(--sm-gold-s)',
    border: 'var(--sm-gold-b)',
  },
] as const;

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="space-y-10" id="comment-ca-marche">
      {/* Header */}
      <div className="sm-reveal" style={{ ...(visible ? { opacity: 1, transform: 'none' } : {}) }}>
        <p
          className="mb-1 text-[10px] font-semibold tracking-widest uppercase"
          style={{ color: 'var(--sm-coral)' }}
        >
          Simple & rapide
        </p>
        <h2
          className="font-display text-3xl font-extrabold sm:text-4xl"
          style={{ color: 'var(--sm-fg)' }}
        >
          Comment ça marche ?
        </h2>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Horizontal connector line — desktop only */}
        <div
          className="absolute top-9 right-0 left-0 z-0 hidden h-px md:block"
          style={{ background: 'var(--sm-border2)' }}
        >
          <div
            ref={lineRef}
            className="h-full origin-left"
            style={{
              background:
                'linear-gradient(90deg, var(--sm-coral), var(--sm-indigo), var(--sm-gold))',
              transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s',
              width: visible ? '100%' : '0%',
            }}
          />
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map(({ n, icon: Icon, title, body, color, bg, border }, idx) => (
            <div
              key={n}
              className="sm-reveal flex flex-col gap-5"
              style={{
                transitionDelay: `${idx * 120}ms`,
                ...(visible ? { opacity: 1, transform: 'none' } : {}),
              }}
            >
              {/* Step number + connector dot */}
              <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-0">
                <div
                  className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl border"
                  style={{ background: bg, borderColor: border }}
                >
                  {/* Dot on connector line */}
                  <div
                    className="absolute -bottom-3 left-1/2 hidden h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 md:block"
                    style={{ background: color, borderColor: bg }}
                  />
                  <Icon className="h-7 w-7" style={{ color }} />
                </div>
              </div>

              {/* Card */}
              <div
                className="card-hover flex-1 space-y-3 rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'var(--sm-surface)',
                  borderColor: 'var(--sm-border)',
                }}
              >
                {/* Step label */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-bold tracking-widest uppercase"
                    style={{ color }}
                  >
                    Étape {n}
                  </span>
                  <span
                    className="font-display text-4xl leading-none font-extrabold select-none"
                    style={{ color, opacity: 0.1 }}
                  >
                    {n}
                  </span>
                </div>

                <h3
                  className="font-display text-xl font-extrabold"
                  style={{ color: 'var(--sm-fg)' }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--sm-muted)' }}>
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
