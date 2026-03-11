"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MessageCircle, Shield, Zap, Clock } from "lucide-react";
import { ROUTES } from "@/lib/config/routes";

type ServiceItem = { id: string; name: string; logoUrl: string | null };

// ─── Animated counter ──────────────────────────────────────────────────────

function useCountUp(target: number, active: boolean, duration = 1400) {
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

// ─── Stat pill ─────────────────────────────────────────────────────────────

type StatProps = {
  icon: React.ElementType;
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  active: boolean;
  delay: number;
};

function StatPill({
  icon: Icon,
  value,
  prefix = "",
  suffix = "",
  label,
  color,
  bg,
  border,
  active,
  delay,
}: StatProps) {
  const count = useCountUp(value, active, 1400);
  return (
    <div
      className="sm-reveal flex items-center gap-3 rounded-2xl px-4 py-3 border"
      style={{
        background: bg,
        borderColor: border,
        transitionDelay: `${delay}ms`,
      }}
    >
      <div
        className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: bg, border: `1px solid ${border}` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div>
        <p
          className="font-display font-extrabold text-xl leading-none tabular-nums"
          style={{ color }}
        >
          {prefix}
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

// ─── Perspective logo mosaic ───────────────────────────────────────────────

function LogoMosaic({ services }: { services: ServiceItem[] }) {
  if (services.length === 0) return null;

  const TOTAL = 16;
  const tiles: ServiceItem[] = [];
  while (tiles.length < TOTAL) {
    tiles.push(...services.slice(0, TOTAL - tiles.length));
  }

  return (
    <div className="relative select-none" style={{ perspective: "700px" }}>
      {/* Ambient glow behind grid */}
      <div
        className="absolute inset-0 -z-10 blur-3xl pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 50%, oklch(0.62 0.22 28 / 0.1), oklch(0.58 0.18 255 / 0.06), transparent)",
        }}
        aria-hidden="true"
      />

      <div
        className="grid grid-cols-4 gap-3"
        style={{
          transform: "rotateX(18deg) rotateY(-12deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {tiles.map((s, i) => {
          const floatDuration = 2.8 + (i % 5) * 0.35;
          const floatDelay = i * 0.09;
          return (
            <div
              key={`tile-${i}`}
              className="h-16 w-16 rounded-2xl overflow-hidden border flex items-center justify-center"
              style={{
                background: "var(--sm-surface)",
                borderColor: "var(--sm-border2)",
                boxShadow: "0 8px 24px oklch(0 0 0 / 0.15)",
                animation: `sm-float ${floatDuration}s ease-in-out infinite`,
                animationDelay: `${floatDelay}s`,
              }}
            >
              {s.logoUrl ? (
                <Image
                  src={s.logoUrl}
                  alt={s.name}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span
                  className="font-display font-bold text-xl"
                  style={{ color: "var(--sm-coral)" }}
                >
                  {s.name.charAt(0)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────

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
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const serviceCountLabel =
    services.length > 0
      ? `${services.length} plateforme${
          services.length > 1 ? "s" : ""
        } disponible${services.length > 1 ? "s" : ""}`
      : "vos plateformes préférées";

  return (
    <section
      className="relative overflow-hidden sm-grain"
      style={{ background: "var(--sm-void)", minHeight: "100svh" }}
    >
      {/* Geometric grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(var(--sm-hero-grid) 1px, transparent 1px), linear-gradient(90deg, var(--sm-hero-grid) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Coral ambient — top right */}
      <div
        className="absolute top-0 right-0 w-[700px] h-[500px] pointer-events-none blur-[120px]"
        aria-hidden="true"
        style={{
          background: "oklch(0.62 0.22 28 / 0.07)",
          transform: "translate(20%, -20%)",
        }}
      />
      {/* Indigo ambient — bottom left */}
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[400px] pointer-events-none blur-[120px]"
        aria-hidden="true"
        style={{
          background: "oklch(0.58 0.18 255 / 0.07)",
          transform: "translate(-20%, 20%)",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 min-h-[100svh] flex flex-col justify-center py-28 lg:py-36">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-6 items-center">
          {/* ── Left: copy ──────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-8">
            {/* Eyebrow */}
            <div
              className="sm-fade-in inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
              style={{
                background: "var(--sm-coral-s)",
                border: "1px solid var(--sm-coral-b)",
                color: "var(--sm-coral)",
                animationDelay: "0ms",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
              {serviceCountLabel}
            </div>

            {/* Headline */}
            <div style={{ maxWidth: "580px" }}>
              <h1 className="font-display font-extrabold leading-[0.92] tracking-tight">
                <span
                  className="sm-fade-up block"
                  style={{
                    fontSize: "clamp(3rem,7vw,5.5rem)",
                    color: "var(--sm-fg)",
                    animationDelay: "80ms",
                  }}
                >
                  Streamez.
                </span>
                <span
                  className="sm-fade-up block"
                  style={{
                    fontSize: "clamp(3rem,7vw,5.5rem)",
                    color: "var(--sm-fg)",
                    animationDelay: "160ms",
                  }}
                >
                  Profitez.
                </span>
                <span
                  className="sm-fade-up block"
                  style={{
                    fontSize: "clamp(2rem,5vw,4rem)",
                    color: "var(--sm-coral)",
                    animationDelay: "240ms",
                  }}
                >
                  À prix imbattable.
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p
              className="sm-fade-up text-base sm:text-lg max-w-md leading-relaxed"
              style={{ color: "var(--sm-muted)", animationDelay: "320ms" }}
            >
              Netflix, Shahid, Disney+ et vos plateformes préférées — sans
              engagement, activés en moins de 24h.
            </p>

            {/* Trust stats */}
            <div ref={statsRef} className="flex flex-wrap gap-3">
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

            {/* CTAs */}
            <div
              className="sm-fade-up flex flex-col sm:flex-row gap-3"
              style={{ animationDelay: "480ms" }}
            >
              <Link href={ROUTES.contact} className="sm-btn-coral">
                <MessageCircle className="h-4 w-4" />
                Commander maintenant
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#catalogue" className="sm-btn-ghost">
                Voir le catalogue
              </a>
            </div>
          </div>

          {/* ── Right: logo mosaic ──────────────────────────────────── */}
          <div
            className="hidden lg:flex lg:col-span-2 items-center justify-center sm-fade-in"
            style={{ animationDelay: "560ms" }}
          >
            <LogoMosaic services={services} />
          </div>
        </div>
      </div>

      {/* Bottom fade into page */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(to bottom, transparent, var(--background))",
        }}
        aria-hidden="true"
      />
    </section>
  );
}
