import { getAllSubscriptions } from "@/lib/db/repositories/subscriptions.repository";
import { getDefaultCurrency } from "@/lib/db/repositories/analytics.repository";
import { SubscriptionsEditor } from "@/components/console/cms/subscriptions-editor";
import type { SubscriptionDto } from "@/lib/graphql/operations/subscriptions.operations";

export default async function SubscriptionsPage() {
  const [rows, currency] = await Promise.all([
    getAllSubscriptions(),
    getDefaultCurrency(),
  ]);
  const subscriptions: SubscriptionDto[] = rows.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));
  return (
    <SubscriptionsEditor
      initialData={subscriptions}
      defaultCurrency={currency}
    />
  );
}
