import { CheckCircle2 } from "lucide-react";

const TRUST_ITEMS = [
  "100% légal",
  "Sans engagement",
  "Activation en moins de 24h",
  "Support réactif 7j/7",
  "Paiement sécurisé",
  "Satisfaction garantie",
  "Zéro frais cachés",
  "Prix imbattables",
] as const;

export function TrustStrip() {
  // Double for seamless loop
  const doubled = [...TRUST_ITEMS, ...TRUST_ITEMS];

  return (
    <div
      className="relative overflow-hidden border-y py-3"
      style={{
        background: "var(--sm-surface)",
        borderColor: "var(--sm-border)",
      }}
    >
      {/* Left fade */}
      <div
        className="absolute inset-y-0 left-0 w-16 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, var(--sm-surface), transparent)",
        }}
        aria-hidden="true"
      />
      {/* Right fade */}
      <div
        className="absolute inset-y-0 right-0 w-16 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to left, var(--sm-surface), transparent)",
        }}
        aria-hidden="true"
      />

      <div
        className="flex w-max gap-8"
        style={{ animation: "sm-trust-marquee 28s linear infinite" }}
      >
        {doubled.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-xs font-semibold whitespace-nowrap"
            style={{ color: "var(--sm-muted)" }}
          >
            <CheckCircle2
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: "var(--sm-coral)" }}
            />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
