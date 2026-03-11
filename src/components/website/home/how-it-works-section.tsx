"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, CreditCard, Zap } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: MessageCircle,
    title: "Choisissez",
    body: "Parcourez le catalogue. Cliquez sur un service ou un pack pour voir les formules et les tarifs détaillés.",
    color: "var(--sm-coral)",
    bg: "var(--sm-coral-s)",
    border: "var(--sm-coral-b)",
  },
  {
    n: "02",
    icon: CreditCard,
    title: "Payez",
    body: "Contactez-nous, confirmez votre commande et effectuez le paiement par virement ou CIH Money. Zéro frais cachés.",
    color: "var(--sm-indigo)",
    bg: "var(--sm-indigo-s)",
    border: "oklch(0.58 0.18 255 / 0.28)",
  },
  {
    n: "03",
    icon: Zap,
    title: "Accédez",
    body: "Vos identifiants sont activés dans les 24h. En pratique, c'est souvent bien plus rapide — parfois dans l'heure.",
    color: "var(--sm-gold)",
    bg: "var(--sm-gold-s)",
    border: "var(--sm-gold-b)",
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
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="space-y-10" id="comment-ca-marche">
      {/* Header */}
      <div
        className="sm-reveal"
        style={{ ...(visible ? { opacity: 1, transform: "none" } : {}) }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-1"
          style={{ color: "var(--sm-coral)" }}
        >
          Simple & rapide
        </p>
        <h2
          className="font-display font-extrabold text-3xl sm:text-4xl"
          style={{ color: "var(--sm-fg)" }}
        >
          Comment ça marche ?
        </h2>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Horizontal connector line — desktop only */}
        <div
          className="hidden md:block absolute top-9 left-0 right-0 h-px z-0"
          style={{ background: "var(--sm-border2)" }}
        >
          <div
            ref={lineRef}
            className="h-full origin-left"
            style={{
              background:
                "linear-gradient(90deg, var(--sm-coral), var(--sm-indigo), var(--sm-gold))",
              transition: "width 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
              width: visible ? "100%" : "0%",
            }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {STEPS.map(
            ({ n, icon: Icon, title, body, color, bg, border }, idx) => (
              <div
                key={n}
                className="sm-reveal flex flex-col gap-5"
                style={{
                  transitionDelay: `${idx * 120}ms`,
                  ...(visible ? { opacity: 1, transform: "none" } : {}),
                }}
              >
                {/* Step number + connector dot */}
                <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-0">
                  <div
                    className="relative h-[72px] w-[72px] rounded-2xl flex items-center justify-center shrink-0 border"
                    style={{ background: bg, borderColor: border }}
                  >
                    {/* Dot on connector line */}
                    <div
                      className="hidden md:block absolute -bottom-3 left-1/2 -translate-x-1/2 h-2.5 w-2.5 rounded-full border-2"
                      style={{ background: color, borderColor: bg }}
                    />
                    <Icon className="h-7 w-7" style={{ color }} />
                  </div>
                </div>

                {/* Card */}
                <div
                  className="rounded-2xl border p-5 space-y-3 flex-1"
                  style={{
                    background: "var(--sm-surface)",
                    borderColor: "var(--sm-border)",
                  }}
                >
                  {/* Step label */}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color }}
                    >
                      Étape {n}
                    </span>
                    <span
                      className="font-display font-extrabold text-4xl leading-none select-none"
                      style={{ color, opacity: 0.1 }}
                    >
                      {n}
                    </span>
                  </div>

                  <h3
                    className="font-display font-extrabold text-xl"
                    style={{ color: "var(--sm-fg)" }}
                  >
                    {title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--sm-muted)" }}
                  >
                    {body}
                  </p>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
