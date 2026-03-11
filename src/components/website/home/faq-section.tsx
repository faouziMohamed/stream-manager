"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FaqEntry = { q: string; a: string; category: string };

const FAQS: FaqEntry[] = [
  {
    category: "Légal",
    q: "Est-ce que ces abonnements sont légaux ?",
    a: "Oui. Nous proposons des abonnements officiels via des comptes partagés ou des offres légales. Chaque accès respecte les conditions d'utilisation des plateformes concernées.",
  },
  {
    category: "Paiement",
    q: "Comment se passe le paiement ?",
    a: "Le paiement se fait par virement bancaire, CIH Money, ou tout autre moyen convenu lors de votre commande. Aucun paiement n'est traité avant confirmation de la disponibilité.",
  },
  {
    category: "Accès",
    q: "Dans quel délai vais-je recevoir mon accès ?",
    a: "Vos accès sont activés dans les 24 heures suivant la confirmation de votre paiement. Pour la majorité des commandes, c'est plus rapide — souvent dans l'heure.",
  },
  {
    category: "Accès",
    q: "Sur combien d'appareils puis-je utiliser mon abonnement ?",
    a: "Cela dépend du plan choisi. Le nombre de profils ou d'appareils simultanés est indiqué dans les fiches de chaque service. Contactez-nous pour toute précision.",
  },
  {
    category: "Abonnement",
    q: "Que se passe-t-il à la fin de mon abonnement ?",
    a: "Vous recevrez un rappel avant l'expiration. Vous pouvez renouveler à tout moment au même tarif. Sans renouvellement, l'accès est suspendu — aucun prélèvement automatique.",
  },
  {
    category: "Abonnement",
    q: "Proposez-vous un remboursement si je ne suis pas satisfait ?",
    a: "Nous visons une satisfaction totale. Si un problème technique survient de notre côté dans les 48h suivant l'activation, nous trouvons une solution (remplacement ou remboursement au prorata).",
  },
  {
    category: "Commande",
    q: "Puis-je commander plusieurs services en même temps ?",
    a: "Absolument. Vous pouvez combiner plusieurs services individuels ou opter pour un de nos packs groupés qui offrent un prix réduit sur l'ensemble.",
  },
  {
    category: "Support",
    q: "Comment vous contacter en cas de problème ?",
    a: "Via le formulaire de contact sur ce site. Nous répondons généralement dans l'heure, 7 jours sur 7.",
  },
];

const CATEGORIES = [
  "Tout",
  ...Array.from(new Set(FAQS.map((f) => f.category))),
];

export function FaqSection() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tout");
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
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

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return FAQS.filter((f) => {
      const matchesSearch =
        !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
      const matchesCategory =
        activeCategory === "Tout" || f.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [query, activeCategory]);

  const half = Math.ceil(filtered.length / 2);
  const leftCol = filtered.slice(0, half);
  const rightCol = filtered.slice(half);

  return (
    <section ref={sectionRef} className="space-y-8" id="faq">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm-reveal"
        style={{ ...(visible ? { opacity: 1, transform: "none" } : {}) }}
      >
        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-widest mb-1"
            style={{ color: "var(--sm-coral)" }}
          >
            FAQ
          </p>
          <h2
            className="font-display font-extrabold text-3xl sm:text-4xl"
            style={{ color: "var(--sm-fg)" }}
          >
            Questions fréquentes
          </h2>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
            style={{ color: "var(--sm-muted)" }}
          />
          <input
            type="text"
            placeholder="Rechercher une question…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
            style={{
              background: "var(--sm-surface)",
              border: "1px solid var(--sm-border)",
              color: "var(--sm-fg)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--sm-coral-b)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--sm-border)";
            }}
          />
        </div>
      </div>

      {/* Category chips */}
      <div
        className="flex flex-wrap gap-2 sm-reveal"
        style={{
          transitionDelay: "80ms",
          ...(visible ? { opacity: 1, transform: "none" } : {}),
        }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
              style={
                isActive
                  ? {
                      background: "var(--sm-coral)",
                      color: "var(--sm-coral-fg)",
                    }
                  : {
                      background: "var(--sm-surface2)",
                      border: "1px solid var(--sm-border)",
                      color: "var(--sm-muted)",
                    }
              }
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Two-column accordion */}
      <div
        className="sm-reveal"
        style={{
          transitionDelay: "160ms",
          ...(visible ? { opacity: 1, transform: "none" } : {}),
        }}
      >
        {filtered.length === 0 ? (
          <p
            className="py-10 text-center text-sm"
            style={{ color: "var(--sm-muted)" }}
          >
            Aucune question ne correspond à votre recherche.
          </p>
        ) : (
          <div
            className="rounded-2xl border overflow-hidden grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x"
            style={{ borderColor: "var(--sm-border)" }}
          >
            {/* Left column */}
            <Accordion
              type="multiple"
              className="divide-y"
              style={
                { "--divide-color": "var(--sm-border)" } as React.CSSProperties
              }
            >
              {leftCol.map((faq, i) => (
                <AccordionItem
                  key={`l-${i}`}
                  value={`l-${i}`}
                  className="px-5"
                  style={{ borderColor: "var(--sm-border)" }}
                >
                  <AccordionTrigger
                    className="no-underline hover:no-underline py-4 text-sm font-semibold text-left gap-3"
                    style={{ color: "var(--sm-fg)" }}
                  >
                    <span className="flex-1 text-left">{faq.q}</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pb-4">
                      <span
                        className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2"
                        style={{
                          background: "var(--sm-coral-s)",
                          color: "var(--sm-coral)",
                        }}
                      >
                        {faq.category}
                      </span>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--sm-muted)" }}
                      >
                        {faq.a}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Right column */}
            <Accordion type="multiple" className="divide-y">
              {rightCol.map((faq, i) => (
                <AccordionItem
                  key={`r-${i}`}
                  value={`r-${i}`}
                  className="px-5"
                  style={{ borderColor: "var(--sm-border)" }}
                >
                  <AccordionTrigger
                    className="no-underline hover:no-underline py-4 text-sm font-semibold text-left gap-3"
                    style={{ color: "var(--sm-fg)" }}
                  >
                    <span className="flex-1 text-left">{faq.q}</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pb-4">
                      <span
                        className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2"
                        style={{
                          background: "var(--sm-coral-s)",
                          color: "var(--sm-coral)",
                        }}
                      >
                        {faq.category}
                      </span>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--sm-muted)" }}
                      >
                        {faq.a}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </div>
    </section>
  );
}
