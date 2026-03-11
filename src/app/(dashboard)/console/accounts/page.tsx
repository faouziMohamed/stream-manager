import {
  getAllAccounts,
  getProfilesByAccount,
} from "@/lib/db/repositories/accounts.repository";
import { getAllServices } from "@/lib/db/repositories/services.repository";
import { getAllSubscriptions } from "@/lib/db/repositories/subscriptions.repository";
import { AccountsEditor } from "@/components/console/cms/accounts-editor";
import type { StreamingAccountDto } from "@/lib/graphql/operations/accounts.operations";
import type { ServiceDto } from "@/lib/graphql/operations/services.operations";
import type { SubscriptionDto } from "@/lib/graphql/operations/subscriptions.operations";

export default async function AccountsPage() {
  const [accountRows, serviceRows, subscriptionRows] = await Promise.all([
    getAllAccounts(),
    getAllServices(),
    getAllSubscriptions(),
  ]);

  // Hydrate profiles for each account
  const accounts: StreamingAccountDto[] = await Promise.all(
    accountRows.map(async (acc) => {
      const profiles = await getProfilesByAccount(acc.id);
      return {
        id: acc.id,
        serviceId: acc.serviceId,
        label: acc.label,
        email: acc.email ?? null,
        phone: acc.phone ?? null,
        supportsProfiles: acc.supportsProfiles,
        maxProfiles: acc.maxProfiles,
        usedProfiles: 0, // computed server-side resolver on client refetch
        notes: acc.notes ?? null,
        isActive: acc.isActive,
        createdAt: acc.createdAt.toISOString(),
        updatedAt: acc.updatedAt.toISOString(),
        service: serviceRows.find((s) => s.id === acc.serviceId)
          ? {
              id: serviceRows.find((s) => s.id === acc.serviceId)!.id,
              name: serviceRows.find((s) => s.id === acc.serviceId)!.name,
              logoUrl:
                serviceRows.find((s) => s.id === acc.serviceId)!.logoUrl ??
                null,
            }
          : null,
        profiles: profiles.map((p) => ({
          id: p.id,
          accountId: p.accountId,
          name: p.name,
          profileIndex: p.profileIndex,
          pin: p.pin ?? null,
          isActive: p.isActive,
          assignment: null,
        })),
        accountAssignment: null,
      };
    }),
  );

  const services: ServiceDto[] = serviceRows.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.description ?? null,
    logoUrl: s.logoUrl ?? null,
    isActive: s.isActive,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  const subscriptions: SubscriptionDto[] = subscriptionRows.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  return (
    <AccountsEditor
      initialData={accounts}
      services={services}
      subscriptions={subscriptions}
    />
  );
}
