import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {ArrowRight, MessageCircle, Package, Sparkles, Tv} from 'lucide-react';
import {ROUTES} from '@/lib/config/routes';
import {
    getAllPlans,
    getPlansByPromotion,
    getPublicPromotions,
    getPublicServices,
    getServicesForPromotion,
} from '@/lib/db/repositories/services.repository';
import {formatCurrency} from '@/lib/utils/helpers';

// ─── Service avatar ───────────────────────────────────────────────────────────

function ServiceAvatar({name, logoUrl, size = 'md'}: { name: string; logoUrl?: string | null; size?: 'sm' | 'md' }) {
    const dim = {
        sm: 'h-7 w-7 text-xs rounded-lg',
        md: 'h-11 w-11 text-sm rounded-xl',
    };
    if (logoUrl) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={logoUrl} alt={name} className={`${dim[size]} object-cover shrink-0 border border-border/50`}/>;
    }
    return (
        <div
            className={`${dim[size]} shrink-0 flex items-center justify-center font-bold bg-primary/10 text-primary border border-primary/20`}>
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
            <div
                className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Tv className="h-7 w-7 text-primary"/>
            </div>
            <div className="space-y-2 max-w-sm">
                <h2 className="text-xl font-bold">Offres bientôt disponibles</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    Nos abonnements streaming sont en cours de configuration.
                    Revenez bientôt ou contactez-nous directement.
                </p>
            </div>
            <Button asChild className="gap-2 cursor-pointer">
                <Link href={ROUTES.contact}><MessageCircle className="h-4 w-4"/>Nous contacter</Link>
            </Button>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
    const [rawServices, rawPromos] = await Promise.all([
        getPublicServices().catch(() => []),
        getPublicPromotions().catch(() => []),
    ]);

    const services = await Promise.all(
        rawServices.map(async (s) => {
            const plans = await getAllPlans(s.id);
            return {...s, plans: plans.filter((p) => p.isActive)};
        }),
    );

    const promos = await Promise.all(
        rawPromos.map(async (p) => {
            const [promoServices, plans] = await Promise.all([
                getServicesForPromotion(p.id),
                getPlansByPromotion(p.id),
            ]);
            return {...p, services: promoServices, plans};
        }),
    );

    const hasContent = services.length > 0 || promos.length > 0;

    return (
        <div className="min-h-screen">

            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 to-transparent">
                <div className="max-w-4xl mx-auto px-4 py-20 sm:py-28 text-center space-y-7">
                    <div
                        className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium border border-primary/20">
                        <Sparkles className="h-3.5 w-3.5"/>
                        Abonnements streaming au meilleur prix
                    </div>
                    <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.1]">
                        Netflix, Shahid, Disney+<br/>
                        <span className="text-primary">sans vous ruiner.</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
                        Accédez à vos plateformes préférées à des prix imbattables —
                        paiement simple, accès instantané.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Button asChild size="lg" className="w-full sm:w-auto gap-2 cursor-pointer">
                            <Link href={ROUTES.contact}>
                                Commander maintenant<ArrowRight className="h-4 w-4"/>
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="w-full sm:w-auto cursor-pointer">
                            <Link href="#offres">Voir les offres</Link>
                        </Button>
                    </div>
                    {/* Logo strip — only when we have live services with logos */}
                    {services.some((s) => s.logoUrl) && (
                        <div className="flex items-center justify-center gap-2.5 pt-2 flex-wrap">
                            {services.filter((s) => s.logoUrl).slice(0, 7).map((s) => (
                                <ServiceAvatar key={s.id} name={s.name} logoUrl={s.logoUrl} size="sm"/>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ── Content ───────────────────────────────────────────────────── */}
            <div className="max-w-5xl mx-auto px-4 py-14 space-y-16" id="offres">

                {!hasContent && <EmptyState/>}

                {/* ── Promotions ────────────────────────────────────────────── */}
                {promos.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div
                                className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                <Package className="h-4 w-4 text-amber-500"/>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Offres groupées</h2>
                                <p className="text-xs text-muted-foreground">Plusieurs services, un seul prix</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {promos.map((promo) => (
                                <div key={promo.id}
                                     className="rounded-2xl border border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 transition-all p-5 space-y-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-1.5 min-w-0">
                                            <h3 className="font-bold text-base leading-snug">{promo.name}</h3>
                                            {promo.services.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {promo.services.map((s) => (
                                                        <div key={s.id}
                                                             className="flex items-center gap-1 bg-background rounded-full pl-0.5 pr-2 py-0.5 border text-xs text-muted-foreground">
                                                            <ServiceAvatar name={s.name} logoUrl={(s as {
                                                                logoUrl?: string | null
                                                            }).logoUrl} size="sm"/>
                                                            {s.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <Badge
                                            className="shrink-0 bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25 hover:bg-amber-500/15 text-xs">
                                            Pack
                                        </Badge>
                                    </div>
                                    {promo.expiresAt && (
                                        <p className="text-xs text-muted-foreground">
                                            Expire le {new Date(promo.expiresAt).toLocaleDateString('fr-FR', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                        </p>
                                    )}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {promo.plans.map((plan) => (
                                            <div key={plan.id}
                                                 className="rounded-xl bg-background border hover:border-primary/30 transition-colors p-2.5 text-center">
                                                <p className="text-xs text-muted-foreground mb-1">{plan.durationMonths} mois</p>
                                                <p className="font-bold text-primary text-sm tabular-nums">
                                                    {formatCurrency(Number(plan.price), plan.currencyCode)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Individual services ───────────────────────────────────── */}
                {services.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div
                                className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                <Tv className="h-4 w-4 text-primary"/>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">Services individuels</h2>
                                <p className="text-xs text-muted-foreground">Choisissez la durée qui vous convient</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {services.map((service) => (
                                <div key={service.id}
                                     className="rounded-2xl border bg-card hover:border-primary/40 hover:shadow-sm transition-all p-5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <ServiceAvatar name={service.name} logoUrl={service.logoUrl} size="md"/>
                                        <div className="min-w-0">
                                            <p className="font-bold leading-tight truncate">{service.name}</p>
                                            <p className="text-xs text-muted-foreground truncate capitalize">{service.category}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        {service.plans.map((plan) => (
                                            <div key={plan.id}
                                                 className="flex items-center justify-between text-sm py-1.5 border-b border-dashed border-border/50 last:border-0">
                                                <span
                                                    className="text-muted-foreground">{plan.durationMonths} mois</span>
                                                <span className="font-semibold tabular-nums">
                                                    {formatCurrency(Number(plan.price), plan.currencyCode)}
                                                </span>
                                            </div>
                                        ))}
                                        {service.plans.length === 0 && (
                                            <p className="text-sm text-muted-foreground italic py-1">Formules à
                                                venir</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── CTA ───────────────────────────────────────────────────── */}
                {hasContent && (
                    <section
                        className="rounded-2xl bg-primary text-primary-foreground p-8 sm:p-12 text-center space-y-4">
                        <h2 className="text-2xl sm:text-3xl font-extrabold">Prêt à vous abonner ?</h2>
                        <p className="text-primary-foreground/75 max-w-sm mx-auto text-sm leading-relaxed">
                            Contactez-nous pour passer commande ou poser vos questions.
                            Réponse rapide garantie.
                        </p>
                        <Button asChild size="lg" variant="secondary" className="cursor-pointer gap-2">
                            <Link href={ROUTES.contact}><MessageCircle className="h-4 w-4"/>Nous contacter</Link>
                        </Button>
                    </section>
                )}
            </div>
        </div>
    );
}
