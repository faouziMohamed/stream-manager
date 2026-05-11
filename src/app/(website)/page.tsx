import { Tv, MessageCircle } from 'lucide-react';
import type { Metadata } from 'next';
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
import { JsonLd } from '@/modules/seo/client/components/json-ld';
import { ROUTES } from '@/lib/config/routes';

export const metadata: Metadata = {
  title: 'Abonnements streaming pas chers — Netflix, Disney+, Spotify',
  description:
    'StreamManager vous propose des abonnements streaming au meilleur prix au Maroc. Activation en moins de 24h. Netflix, Disney+, Spotify, et plus.',
  openGraph: {
    title: 'Abonnements streaming pas chers — Netflix, Disney+, Spotify',
    description: 'Économisez sur vos abonnements streaming. Activation en moins de 24h.',
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Est-ce que ces abonnements sont légaux ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Oui. Nous proposons des abonnements officiels via des comptes partagés ou des offres légales. Chaque accès respecte les conditions d'utilisation des plateformes concernées.",
      },
    },
    {
      '@type': 'Question',
      name: 'Comment se passe le paiement ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Le paiement se fait par virement bancaire, CIH Money, ou tout autre moyen convenu lors de votre commande. Aucun paiement n'est traité avant confirmation de la disponibilité.",
      },
    },
    {
      '@type': 'Question',
      name: 'Dans quel délai vais-je recevoir mon accès ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Vos accès sont activés dans les 24 heures suivant la confirmation de votre paiement. Pour la majorité des commandes, c'est plus rapide — souvent dans l'heure.",
      },
    },
    {
      '@type': 'Question',
      name: 'Que se passe-t-il à la fin de mon abonnement ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Vous recevrez un rappel avant l'expiration. Vous pouvez renouveler à tout moment au même tarif. Sans renouvellement, l'accès est suspendu — aucun prélèvement automatique.",
      },
    },
    {
      '@type': 'Question',
      name: 'Proposez-vous un remboursement si je ne suis pas satisfait ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Nous visons une satisfaction totale. Si un problème technique survient de notre côté dans les 48h suivant l'activation, nous trouvons une solution (remplacement ou remboursement au prorata).",
      },
    },
    {
      '@type': 'Question',
      name: 'Puis-je commander plusieurs services en même temps ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Absolument. Vous pouvez combiner plusieurs services individuels ou opter pour un de nos packs groupés qui offrent un prix réduit sur l'ensemble.",
      },
    },
    {
      '@type': 'Question',
      name: 'Comment vous contacter en cas de problème ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Via le formulaire de contact sur ce site. Nous répondons généralement dans l'heure, 7 jours sur 7.",
      },
    },
  ],
};

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
      <JsonLd data={faqJsonLd} />

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
