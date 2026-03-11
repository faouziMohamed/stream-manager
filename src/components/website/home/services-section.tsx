"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils/helpers";
import { ROUTES } from "@/lib/config/routes";

type Plan = {
  id: string;
  durationMonths: number;
  price: string | number;
  currencyCode: string;
};

type Service = {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  logoUrl?: string | null;
  plans: Plan[];
};

// ─── Service Detail Dialog ─────────────────────────────────────────────────

function ServiceDialog({
  service,
  open,
  onClose,
}: {
  service: Service;
  open: boolean;
  onClose: () => void;
}) {
  const sorted = [...service.plans].sort(
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
      : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-md border-0 p-0 overflow-hidden"
        style={{ background: "var(--sm-surface)" }}
      >
        {/* Header */}
        <div
          className="relative h-28 flex items-end px-6 pb-4"
          style={{
            background: "var(--sm-surface2)",
            borderBottom: "1px solid var(--sm-border)",
          }}
        >
          <div className="flex items-end gap-4">
            <div
              className="h-16 w-16 rounded-2xl overflow-hidden border shrink-0"
              style={{ borderColor: "var(--sm-border2)" }}
            >
              {service.logoUrl ? (
                <Image
                  src={service.logoUrl}
                  alt={service.name}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-display font-bold text-2xl"
                  style={{
                    background: "var(--sm-coral-s)",
                    color: "var(--sm-coral)",
                  }}
                >
                  {service.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-0.5"
                style={{ color: "var(--sm-coral)" }}
              >
                {service.category}
              </p>
              <h2
                className="font-display font-bold text-xl"
                style={{ color: "var(--sm-fg)" }}
              >
                {service.name}
              </h2>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {service.description && (
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--sm-muted)" }}
            >
              {service.description}
            </p>
          )}

          {sorted.length > 0 ? (
            <div className="space-y-3">
              <p
                className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--sm-muted)" }}
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
                      className="relative rounded-xl p-3 text-center border"
                      style={{
                        background: isBest
                          ? "var(--sm-coral-s)"
                          : "var(--sm-surface2)",
                        borderColor: isBest
                          ? "var(--sm-coral-b)"
                          : "var(--sm-border)",
                      }}
                    >
                      {isBest && (
                        <span
                          className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{
                            background: "var(--sm-coral)",
                            color: "var(--sm-coral-fg)",
                          }}
                        >
                          Meilleur rapport
                        </span>
                      )}
                      <p
                        className="text-xs mb-1"
                        style={{ color: "var(--sm-muted)" }}
                      >
                        {plan.durationMonths} mois
                      </p>
                      <p
                        className="font-display font-extrabold text-lg tabular-nums"
                        style={{
                          color: isBest ? "var(--sm-coral)" : "var(--sm-fg)",
                        }}
                      >
                        {formatCurrency(Number(plan.price), plan.currencyCode)}
                      </p>
                      <p
                        className="text-[10px] tabular-nums"
                        style={{ color: "var(--sm-muted)" }}
                      >
                        {formatCurrency(ppm, plan.currencyCode)}/mois
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm italic" style={{ color: "var(--sm-muted)" }}>
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

// ─── Service card ──────────────────────────────────────────────────────────

function ServiceCard({
  service,
  onClick,
}: {
  service: Service;
  onClick: () => void;
}) {
  const lowestPlan =
    service.plans.length > 0
      ? service.plans.reduce((a, b) =>
          Number(a.price) < Number(b.price) ? a : b,
        )
      : null;

  const cheapestPerMonth = lowestPlan
    ? Number(lowestPlan.price) / lowestPlan.durationMonths
    : null;

  const hasBestValue = service.plans.length > 1;

  return (
    <button
      type="button"
      onClick={onClick}
      className="sm-card group relative rounded-2xl overflow-hidden text-left w-full cursor-pointer border flex flex-col"
      style={{
        background: "var(--sm-surface)",
        borderColor: "var(--sm-border)",
      }}
    >
      {/* Logo area — square aspect */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: "1 / 1",
          background: "var(--sm-surface2)",
        }}
      >
        {service.logoUrl ? (
          <Image
            src={service.logoUrl}
            alt={service.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-display font-extrabold text-5xl"
              style={{ color: "oklch(1 0 0 / 0.12)" }}
            >
              {service.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Plan count badge */}
        {service.plans.length > 0 && (
          <div
            className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              background: "var(--sm-void)",
              color: "var(--sm-muted)",
              border: "1px solid var(--sm-border2)",
            }}
          >
            {service.plans.length} formule{service.plans.length > 1 ? "s" : ""}
          </div>
        )}

        {/* Best value badge */}
        {hasBestValue && (
          <div
            className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              background: "var(--sm-coral)",
              color: "var(--sm-coral-fg)",
            }}
          >
            <Star className="h-2.5 w-2.5 fill-current" />
            Multi-offres
          </div>
        )}
      </div>

      {/* Info footer — always visible */}
      <div className="p-3.5 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              className="font-display font-bold text-sm leading-tight truncate"
              style={{ color: "var(--sm-fg)", maxWidth: "120px" }}
            >
              {service.name}
            </p>
            <p
              className="text-[10px] font-medium mt-0.5 truncate"
              style={{ color: "var(--sm-muted)" }}
            >
              {service.category}
            </p>
          </div>
          {cheapestPerMonth && (
            <div className="text-right shrink-0">
              <p className="text-[9px]" style={{ color: "var(--sm-muted)" }}>
                Dès
              </p>
              <p
                className="font-display font-bold text-sm tabular-nums leading-none"
                style={{ color: "var(--sm-coral)" }}
              >
                {formatCurrency(cheapestPerMonth, lowestPlan!.currencyCode)}
                <span className="text-[9px] font-normal">/mois</span>
              </p>
            </div>
          )}
        </div>

        {/* View details row */}
        <div
          className="flex items-center justify-between text-[10px] font-semibold pt-1.5 border-t opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ borderColor: "var(--sm-border)", color: "var(--sm-coral)" }}
        >
          <span>Voir les détails</span>
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </button>
  );
}

// ─── Category filter tabs ──────────────────────────────────────────────────

function CategoryTabs({
  categories,
  active,
  onChange,
}: {
  categories: string[];
  active: string;
  onChange: (cat: string) => void;
}) {
  const allCategories = ["all", ...categories];

  return (
    <div className="flex flex-wrap gap-2">
      {allCategories.map((cat) => {
        const isActive = active === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-200"
            style={
              isActive
                ? { background: "var(--sm-coral)", color: "var(--sm-coral-fg)" }
                : {
                    background: "var(--sm-surface2)",
                    border: "1px solid var(--sm-border)",
                    color: "var(--sm-muted)",
                  }
            }
          >
            {cat === "all" ? "Tout afficher" : cat}
          </button>
        );
      })}
    </div>
  );
}

// ─── Section ───────────────────────────────────────────────────────────────

export function ServicesSection({ services }: { services: Service[] }) {
  const [selected, setSelected] = useState<Service | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (services.length === 0) return null;

  const categories = Array.from(
    new Set(services.map((s) => s.category)),
  ).sort();
  const filtered =
    activeCategory === "all"
      ? services
      : services.filter((s) => s.category === activeCategory);

  return (
    <section ref={sectionRef} className="space-y-6" id="catalogue">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div
          className="sm-reveal"
          style={{ ...(visible ? { opacity: 1, transform: "none" } : {}) }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-1"
            style={{ color: "var(--sm-coral)" }}
          >
            Services individuels
          </p>
          <h2
            className="font-display font-extrabold text-3xl sm:text-4xl"
            style={{ color: "var(--sm-fg)" }}
          >
            Le catalogue complet
          </h2>
        </div>

        {categories.length > 1 && (
          <div
            className="sm-reveal"
            style={{
              transitionDelay: "80ms",
              ...(visible ? { opacity: 1, transform: "none" } : {}),
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {filtered.map((service, i) => (
          <div
            key={service.id}
            className="sm-reveal"
            style={{
              transitionDelay: `${i * 40}ms`,
              ...(visible ? { opacity: 1, transform: "none" } : {}),
            }}
          >
            <ServiceCard
              service={service}
              onClick={() => setSelected(service)}
            />
          </div>
        ))}
      </div>

      {selected && (
        <ServiceDialog
          service={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
