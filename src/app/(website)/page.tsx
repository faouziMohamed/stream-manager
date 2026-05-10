import { Tv, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import {
  getAllPlans,
  getPlansByPromotion,
  getPublicPromotions,
  getPublicServices,
  getServicesForPromotion,
} from '@/lib/db/repositories/services.repository';
import { HeroSection } from '@/components/website/home/hero-section';
import { TrustStrip } from '@/components/website/home/trust-strip';
import { ServicesSection } from '@/modules/services/client/components/public/services-section';
import { PromotionsSection } from '@/modules/promotions/client/components/public/promotions-section';
import { HowItWorksSection } from '@/components/website/home/how-it-works-section';
import { FaqSection } from '@/components/website/home/faq-section';
import { CtaSection } from '@/components/website/home/cta-section';
import { ROUTES } from '@/lib/config/routes';

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-32 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{
          background: 'var(--sm-coral-s)',
          border: '1px solid var(--sm-coral-b)',
        }}
      >
        <Tv className="h-7 w-7" style={{ color: 'var(--sm-coral)' }} />
      </div>
      <div className="max-w-sm space-y-2">
        <h2 className="font-display text-xl font-extrabold" style={{ color: 'var(--sm-fg)' }}>
          Offres bientôt disponibles
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--sm-muted)' }}>
          Nos abonnements streaming sont en cours de configuration. Revenez bientôt ou
          contactez-nous directement.
        </p>
      </div>
      <Link href={ROUTES.contact} className="sm-btn-coral">
        <MessageCircle className="h-4 w-4" />
        Nous contacter
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const [rawServices, rawPromos] = await Promise.all([
    getPublicServices().catch(() => []),
    getPublicPromotions().catch(() => []),
  ]);

  const services = await Promise.all(
    rawServices.map(async (s) => {
      const plans = await getAllPlans(s.id);
      return { ...s, plans: plans.filter((p) => p.isActive) };
    })
  );

  const promos = await Promise.all(
    rawPromos.map(async (p) => {
      const [promoServices, plans] = await Promise.all([
        getServicesForPromotion(p.id),
        getPlansByPromotion(p.id),
      ]);
      return { ...p, services: promoServices, plans };
    })
  );

  const hasContent = services.length > 0 || promos.length > 0;

  return (
    <>
      {/* ── Hero — full dark viewport ─────────────────────────── */}
      <HeroSection services={services} />

      {/* ── Trust signals marquee ─────────────────────────────── */}
      <TrustStrip />

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl space-y-24 px-4 py-20" style={{ color: 'var(--sm-fg)' }}>
        {!hasContent && <EmptyState />}

        {hasContent && (
          <>
            {/* Packs first — they're the featured deals */}
            <PromotionsSection promos={promos} />

            {/* Individual services catalog */}
            <ServicesSection services={services} />

            {/* Process */}
            <HowItWorksSection />

            {/* FAQ */}
            <FaqSection />

            {/* Final CTA */}
            <CtaSection />
          </>
        )}
      </div>
    </>
  );
}
