"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Layers, Check } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils/helpers";
import { ROUTES } from "@/lib/config/routes";

type Plan = {
  id: string;
  durationMonths: number;
  price: string | number;
  currencyCode: string;
};

type ServiceItem = { id: string; name: string; logoUrl?: string | null };

type Promo = {
  id: string;
  name: string;
  description?: string | null;
  expiresAt?: Date | string | null;
  services: ServiceItem[];
  plans: Plan[];
};

// ─── Promo Detail Dialog ───────────────────────────────────────────────────

function PromoDialog({
  promo,
  open,
  onClose,
}: {
  promo: Promo;
  open: boolean;
  onClose: () => void;
}) {
  const sorted = [...promo.plans].sort(
    (a, b) => a.durationMonths - b.durationMonths,
  );
  const best =
    sorted.length > 1
      ? sorted.reduce((b, p) =>
          Number(p.price) / p.durationMonths <
          Number(b.price) / b.durationMonths
            ? p
            : b,
        )
      : (sorted[0] ?? null);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-lg border-0 p-0 overflow-hidden"
        style={{ background: "var(--sm-surface)" }}
      >
        {/* Gradient header */}
        <div
          className="relative px-6 pt-6 pb-5"
          style={{
            background: "var(--sm-surface2)",
            borderBottom: "1px solid var(--sm-border)",
          }}
        >
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{
              background: "var(--sm-gold-s)",
              border: "1px solid var(--sm-gold-b)",
              color: "var(--sm-gold)",
            }}
          >
            <Layers className="h-3 w-3" /> Pack groupé
          </div>
          <h2
            className="font-display font-extrabold text-2xl leading-tight"
            style={{ color: "var(--sm-fg)" }}
          >
            {promo.name}
          </h2>
          {promo.description && (
            <p
              className="text-sm mt-2 leading-relaxed"
              style={{ color: "var(--sm-muted)" }}
            >
              {promo.description}
            </p>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* Services included */}
          {promo.services.length > 0 && (
            <div className="space-y-2">
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--sm-muted)" }}
              >
                Services inclus
              </p>
              <div className="flex flex-wrap gap-2">
                {promo.services.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-1.5 rounded-full pl-1 pr-3 py-1 text-xs border"
                    style={{
                      background: "var(--sm-surface2)",
                      borderColor: "var(--sm-border2)",
                      color: "var(--sm-fg)",
                    }}
                  >
                    {s.logoUrl ? (
                      <Image
                        src={s.logoUrl}
                        alt={s.name}
                        width={20}
                        height={20}
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{
                          background: "var(--sm-gold-s)",
                          color: "var(--sm-gold)",
                        }}
                      >
                        {s.name.charAt(0)}
                      </div>
                    )}
                    {s.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plans */}
          {sorted.length > 0 && (
            <div className="space-y-2">
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--sm-muted)" }}
              >
                Formules disponibles
              </p>
              <div className="space-y-2">
                {sorted.map((plan) => {
                  const ppm = Number(plan.price) / plan.durationMonths;
                  const isBest = best?.id === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className="relative flex items-center justify-between rounded-xl px-4 py-3 border"
                      style={{
                        background: isBest
                          ? "var(--sm-gold-s)"
                          : "var(--sm-surface2)",
                        borderColor: isBest
                          ? "var(--sm-gold-b)"
                          : "var(--sm-border)",
                      }}
                    >
                      {isBest && (
                        <span
                          className="absolute -top-2.5 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: "var(--sm-gold)",
                            color: "var(--sm-void)",
                          }}
                        >
                          Meilleur rapport
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <Check
                          className="h-3.5 w-3.5"
                          style={{
                            color: isBest
                              ? "var(--sm-gold)"
                              : "var(--sm-muted)",
                          }}
                        />
                        <span
                          className="text-sm font-medium"
                          style={{ color: "var(--sm-fg)" }}
                        >
                          {plan.durationMonths} mois
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className="font-display font-bold tabular-nums text-base"
                          style={{
                            color: isBest ? "var(--sm-gold)" : "var(--sm-fg)",
                          }}
                        >
                          {formatCurrency(
                            Number(plan.price),
                            plan.currencyCode,
                          )}
                        </span>
                        <span
                          className="text-xs ml-2 tabular-nums"
                          style={{ color: "var(--sm-muted)" }}
                        >
                          {formatCurrency(ppm, plan.currencyCode)}/mois
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {promo.expiresAt && (
            <p className="text-xs" style={{ color: "var(--sm-muted)" }}>
              ⏳ Offre disponible jusqu&apos;au{" "}
              {new Date(promo.expiresAt).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}

          <Link
            href={ROUTES.contact}
            className="sm-btn-coral w-full justify-center"
            onClick={onClose}
          >
            Commander ce pack
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Featured mega-card ────────────────────────────────────────────────────

function FeaturedPromoCard({
  promo,
  onClick,
}: {
  promo: Promo;
  onClick: () => void;
}) {
  const lowestPlan =
    promo.plans.length > 0
      ? promo.plans.reduce((a, b) =>
          Number(a.price) < Number(b.price) ? a : b,
        )
      : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left rounded-3xl overflow-hidden cursor-pointer relative border"
      style={{
        background: "var(--sm-surface)",
        borderColor: "var(--sm-gold-b)",
        boxShadow:
          "0 0 0 1px var(--sm-gold-b), 0 24px 64px oklch(0.76 0.16 62 / 0.06)",
      }}
    >
      {/* Gold top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: "linear-gradient(90deg, var(--sm-gold), var(--sm-coral))",
        }}
      />

      <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        {/* Left: badge, name, description */}
        <div className="flex-1 space-y-3">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
            style={{
              background: "var(--sm-gold-s)",
              border: "1px solid var(--sm-gold-b)",
              color: "var(--sm-gold)",
            }}
          >
            <Layers className="h-3 w-3" /> Pack vedette
          </div>
          <h3
            className="font-display font-extrabold leading-tight"
            style={{
              fontSize: "clamp(1.5rem,3vw,2.25rem)",
              color: "var(--sm-fg)",
            }}
          >
            {promo.name}
          </h3>
          {promo.description && (
            <p
              className="text-sm leading-relaxed max-w-sm"
              style={{ color: "var(--sm-muted)" }}
            >
              {promo.description}
            </p>
          )}

          {/* Service logo row */}
          {promo.services.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap mt-2">
              {promo.services.slice(0, 8).map((s, idx) => (
                <div
                  key={s.id}
                  className="h-9 w-9 rounded-xl overflow-hidden border flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    background: "var(--sm-surface2)",
                    borderColor: "var(--sm-border2)",
                    color: "var(--sm-muted)",
                    marginLeft: idx > 0 ? "-6px" : "0",
                    zIndex: 20 - idx,
                    position: "relative",
                  }}
                >
                  {s.logoUrl ? (
                    <Image
                      src={s.logoUrl}
                      alt={s.name}
                      width={36}
                      height={36}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    s.name.charAt(0)
                  )}
                </div>
              ))}
              {promo.services.length > 8 && (
                <span
                  className="text-xs ml-1"
                  style={{ color: "var(--sm-muted)" }}
                >
                  +{promo.services.length - 8}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: price + CTA */}
        <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
          {lowestPlan && (
            <div className="text-right">
              <p className="text-xs" style={{ color: "var(--sm-muted)" }}>
                À partir de
              </p>
              <p
                className="font-display font-extrabold tabular-nums"
                style={{
                  fontSize: "clamp(2rem,4vw,3rem)",
                  color: "var(--sm-gold)",
                  lineHeight: 1,
                }}
              >
                {formatCurrency(
                  Number(lowestPlan.price),
                  lowestPlan.currencyCode,
                )}
              </p>
            </div>
          )}
          <div
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all group-hover:scale-105"
            style={{ background: "var(--sm-gold)", color: "var(--sm-void)" }}
          >
            Voir les formules
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Secondary promo card ──────────────────────────────────────────────────

function PromoCard({ promo, onClick }: { promo: Promo; onClick: () => void }) {
  const lowestPlan =
    promo.plans.length > 0
      ? promo.plans.reduce((a, b) =>
          Number(a.price) < Number(b.price) ? a : b,
        )
      : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="sm-card group w-full text-left rounded-2xl border overflow-hidden cursor-pointer"
      style={{
        background: "var(--sm-surface)",
        borderColor: "var(--sm-border)",
      }}
    >
      <div
        className="h-0.5 w-full"
        style={{
          background: "linear-gradient(90deg, var(--sm-gold), var(--sm-coral))",
        }}
      />
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border"
              style={{
                background: "var(--sm-gold-s)",
                borderColor: "var(--sm-gold-b)",
                color: "var(--sm-gold)",
              }}
            >
              <Layers className="h-2.5 w-2.5" /> Pack
            </div>
            <h3
              className="font-display font-extrabold text-lg leading-tight"
              style={{ color: "var(--sm-fg)" }}
            >
              {promo.name}
            </h3>
          </div>
          {lowestPlan && (
            <div className="text-right shrink-0">
              <p className="text-[10px]" style={{ color: "var(--sm-muted)" }}>
                Dès
              </p>
              <p
                className="font-display font-extrabold text-xl tabular-nums"
                style={{ color: "var(--sm-gold)" }}
              >
                {formatCurrency(
                  Number(lowestPlan.price),
                  lowestPlan.currencyCode,
                )}
              </p>
            </div>
          )}
        </div>

        {promo.services.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {promo.services.slice(0, 6).map((s, idx) => (
              <div
                key={s.id}
                className="h-8 w-8 rounded-xl overflow-hidden border flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{
                  background: "var(--sm-surface2)",
                  borderColor: "var(--sm-border2)",
                  color: "var(--sm-muted)",
                  marginLeft: idx > 0 ? "-6px" : "0",
                  zIndex: 10 - idx,
                  position: "relative",
                }}
              >
                {s.logoUrl ? (
                  <Image
                    src={s.logoUrl}
                    alt={s.name}
                    width={32}
                    height={32}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  s.name.charAt(0)
                )}
              </div>
            ))}
            {promo.services.length > 6 && (
              <span
                className="text-xs ml-1"
                style={{ color: "var(--sm-muted)" }}
              >
                +{promo.services.length - 6}
              </span>
            )}
          </div>
        )}

        {promo.description && (
          <p
            className="text-xs leading-relaxed line-clamp-2"
            style={{ color: "var(--sm-muted)" }}
          >
            {promo.description}
          </p>
        )}

        <div
          className="flex items-center justify-between pt-2 border-t text-xs font-semibold"
          style={{ borderColor: "var(--sm-border)", color: "var(--sm-coral)" }}
        >
          <span>Voir les formules</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
}

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
      { threshold: 0.1 },
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
        className="sm-reveal"
        style={{
          transitionDelay: "0ms",
          ...(sectionVisible ? { opacity: 1, transform: "none" } : {}),
        }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-1"
          style={{ color: "var(--sm-gold)" }}
        >
          Offres groupées
        </p>
        <h2
          className="font-display font-extrabold text-3xl sm:text-4xl"
          style={{ color: "var(--sm-fg)" }}
        >
          Les packs du moment
        </h2>
      </div>

      {/* Featured card */}
      <div
        className="sm-reveal"
        style={{
          transitionDelay: "80ms",
          ...(sectionVisible ? { opacity: 1, transform: "none" } : {}),
        }}
      >
        <FeaturedPromoCard
          promo={featured}
          onClick={() => setSelected(featured)}
        />
      </div>

      {/* Secondary cards */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rest.map((promo, i) => (
            <div
              key={promo.id}
              className="sm-reveal"
              style={{
                transitionDelay: `${160 + i * 80}ms`,
                ...(sectionVisible ? { opacity: 1, transform: "none" } : {}),
              }}
            >
              <PromoCard promo={promo} onClick={() => setSelected(promo)} />
            </div>
          ))}
        </div>
      )}

      {selected && (
        <PromoDialog
          promo={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
