"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Clock,
  Smile,
} from "lucide-react";
import { ROUTES } from "@/lib/config/routes";

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
    suffix: "h",
    label: "Délai d'activation max",
    color: "var(--sm-gold)",
  },
  {
    icon: ShieldCheck,
    value: 100,
    suffix: "%",
    label: "Légal & sans risque",
    color: "var(--sm-indigo)",
  },
  {
    icon: Smile,
    value: 7,
    suffix: "j/7",
    label: "Support disponible",
    color: "var(--sm-coral)",
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
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
  color: string;
  active: boolean;
}) {
  const count = useCountUp(value, active, 1600);
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border px-5 py-3"
      style={{
        background: "var(--sm-surface2)",
        borderColor: "var(--sm-border2)",
      }}
    >
      <Icon className="h-4 w-4 shrink-0" style={{ color }} />
      <div>
        <p
          className="font-display font-extrabold tabular-nums text-lg leading-none"
          style={{ color }}
        >
          {count}
          {suffix}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--sm-muted)" }}>
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
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden rounded-3xl sm-grain"
      style={{
        background:
          "radial-gradient(ellipse 100% 120% at 50% 100%, var(--sm-cta-glow) 0%, var(--sm-void) 65%)",
        border: "1px solid var(--sm-border)",
      }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--sm-hero-grid) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Coral bloom */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] blur-3xl pointer-events-none"
        aria-hidden="true"
        style={{ background: "oklch(0.62 0.22 28 / 0.15)" }}
      />

      <div className="relative z-10 px-6 py-20 sm:py-28 max-w-3xl mx-auto">
        {/* Watermark number */}
        <div
          className="text-center font-display font-extrabold select-none pointer-events-none"
          style={{
            fontSize: "clamp(6rem,20vw,11rem)",
            lineHeight: 1,
            color: "oklch(1 0 0 / 0.03)",
          }}
          aria-hidden="true"
        >
          24h
        </div>

        {/* Headline */}
        <div className="-mt-8 space-y-5 text-center">
          <h2
            className="font-display font-extrabold leading-tight"
            style={{
              fontSize: "clamp(2rem,5vw,3.5rem)",
              color: "var(--sm-fg)",
            }}
          >
            Votre accès activé en{" "}
            <span style={{ color: "var(--sm-coral)" }}>
              moins de 24 heures.
            </span>
          </h2>
          <p
            className="text-sm sm:text-base leading-relaxed max-w-md mx-auto"
            style={{ color: "var(--sm-muted)" }}
          >
            Sans engagement, sans renouvellement automatique. Commandez
            aujourd&apos;hui et profitez de vos plateformes dès ce soir.
          </p>
        </div>

        {/* Animated stats row */}
        <div className="flex flex-wrap justify-center gap-4 mt-10">
          {FINAL_STATS.map((stat) => (
            <StatCard key={stat.label} {...stat} active={active} />
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
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
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs mt-8"
          style={{ color: "var(--sm-muted)" }}
        >
          {["✓ 100% légal", "✓ Sans engagement", "✓ Support réactif 7j/7"].map(
            (item) => (
              <span key={item}>{item}</span>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
