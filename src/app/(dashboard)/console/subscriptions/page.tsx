import { getAllSubscriptions } from "@/lib/db/repositories/subscriptions.repository";
import {
  getAllPlans,
  getAllPromotions,
  getAllServices,
} from "@/lib/db/repositories/services.repository";
import { getAllClients } from "@/lib/db/repositories/clients.repository";
import { getDefaultCurrency } from "@/lib/db/repositories/analytics.repository";
import { SubscriptionsEditor } from "@/components/console/cms/subscriptions-editor";
import type { SubscriptionDto } from "@/lib/graphql/operations/subscriptions.operations";
import type { PlanDto } from "@/lib/graphql/operations/plans.operations";
import type { ServiceDto } from "@/lib/graphql/operations/services.operations";
import type { ClientDto } from "@/lib/graphql/operations/clients.operations";
import type { PromotionDto } from "@/lib/graphql/operations/promotions.operations";

export default async function SubscriptionsPage() {
  const [rows, planRows, serviceRows, clientRows, promotionRows, currency] =
    await Promise.all([
      getAllSubscriptions(),
      getAllPlans(),
      getAllServices(),
      getAllClients(),
      getAllPromotions(),
      getDefaultCurrency(),
    ]);

  const subscriptions: SubscriptionDto[] = rows.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  const plans: PlanDto[] = planRows.map((p) => ({
    id: p.id,
    name: p.name,
    durationMonths: p.durationMonths,
    price: parseFloat(p.price),
    currencyCode: p.currencyCode,
    planType: p.planType as PlanDto["planType"],
    description: p.description ?? null,
    isActive: p.isActive,
    serviceId: p.serviceId ?? null,
    promotionId: p.promotionId ?? null,
  }));

  const services: ServiceDto[] = serviceRows.map((s) => ({
    ...s,
    description: s.description ?? null,
    logoUrl: s.logoUrl ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  const clients: ClientDto[] = clientRows.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email ?? null,
    phone: c.phone ?? null,
    notes: c.notes ?? null,
    isActive: c.isActive,
    activeSubscriptionsCount: 0,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  const promotions: PromotionDto[] = promotionRows.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    isActive: p.isActive,
    isExpired: p.expiresAt ? new Date(p.expiresAt) < new Date() : false,
    startsAt: p.startsAt ? p.startsAt.toISOString() : null,
    expiresAt: p.expiresAt ? p.expiresAt.toISOString() : null,
    services: [],
    plans: [],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <SubscriptionsEditor
      initialData={subscriptions}
      initialPlans={plans}
      initialServices={services}
      initialClients={clients}
      initialPromotions={promotions}
      defaultCurrency={currency}
    />
  );
}
