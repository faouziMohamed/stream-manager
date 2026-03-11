import {
    getAllPromotions,
    getPlansByPromotion,
    getServicesForPromotion
} from '@/lib/db/repositories/services.repository';
import {getDefaultCurrency} from '@/lib/db/repositories/analytics.repository';
import {PromotionsEditor} from '@/components/console/cms/promotions-editor';
import type {PromotionDto} from '@/lib/graphql/operations/promotions.operations';

export default async function PromotionsPage() {
    const [dbPromotions, currency] = await Promise.all([getAllPromotions(), getDefaultCurrency()]);

    const now = new Date();
    const promotions: PromotionDto[] = await Promise.all(
        dbPromotions.map(async (p) => {
            const [services, plans] = await Promise.all([
                getServicesForPromotion(p.id),
                getPlansByPromotion(p.id),
            ]);
            return {
                ...p,
                description: p.description ?? null,
                startsAt: p.startsAt ? p.startsAt.toISOString() : null,
                expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
                isExpired: p.expiresAt ? new Date(p.expiresAt) < now : false,
                services: services.map((s) => ({id: s.id, name: s.name})),
                plans: plans.map((pl) => ({
                    id: pl.id,
                    name: pl.name,
                    durationMonths: pl.durationMonths,
                    price: parseFloat(pl.price),
                    currencyCode: pl.currencyCode,
                })),
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString(),
            };
        })
    );

    return <PromotionsEditor initialData={promotions} defaultCurrency={currency}/>;
}
