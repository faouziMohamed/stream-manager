import { getAllAccounts, getProfilesByAccount } from '@/lib/db/repositories/accounts';
import { getAllAssignments } from '@/modules/accounts/server/repositories/profile-assignments.repository';
import { getAllServices } from '@/lib/db/repositories/services.repository';
import { getAllSubscriptions } from '@/lib/db/repositories/subscriptions.repository';
import { getAllClients } from '@/modules/clients/server/repositories/clients.repository';
import { runSequentially } from '@/lib/utils/promise-utils';
import { AccountsEditor } from '@/modules/accounts/client/components/accounts-editor';
import type { StreamingAccountDto } from '@/lib/graphql/operations/accounts.operations';
import type { ServiceDto } from '@/lib/graphql/operations/services.operations';
import type { SubscriptionDto } from '@/lib/graphql/operations/subscriptions.operations';

export default async function AccountsPage() {
  const [accountRows, serviceRows, subscriptionRows, clientRows, assignmentRows] =
    await runSequentially([
      () => getAllAccounts(),
      () => getAllServices(),
      () => getAllSubscriptions(),
      () => getAllClients(),
      () => getAllAssignments(),
    ]);

  // ── Lookup maps ──────────────────────────────────────────────────────────────
  const clientMap = new Map(clientRows.map((c) => [c.id, c]));
  const subscriptionMap = new Map(subscriptionRows.map((s) => [s.id, s]));

  // profileId → assignment row  (profile-level assignments)
  const profileAssignmentMap = new Map(
    assignmentRows.filter((a) => a.profileId !== null).map((a) => [a.profileId!, a])
  );
  // accountId → assignment row  (account-level / no-profile assignments)
  const accountAssignmentMap = new Map(
    assignmentRows.filter((a) => a.profileId === null).map((a) => [a.accountId, a])
  );

  // ── Hydrate accounts ─────────────────────────────────────────────────────────
  const accounts: StreamingAccountDto[] = await Promise.all(
    accountRows.map(async (acc) => {
      const profileDbRows = await getProfilesByAccount(acc.id);
      const svc = serviceRows.find((s) => s.id === acc.serviceId);

      const profiles = profileDbRows.map((p) => {
        const assignment = profileAssignmentMap.get(p.id) ?? null;
        const sub = assignment ? subscriptionMap.get(assignment.subscriptionId) ?? null : null;
        const clientRow = sub ? (clientMap.get(sub.clientId) ?? null) : null;

        return {
          id: p.id,
          accountId: p.accountId,
          name: p.name,
          profileIndex: p.profileIndex,
          pin: p.pin ?? null,
          isActive: p.isActive,
          assignment: assignment && sub
            ? {
                id: assignment.id,
                subscriptionId: assignment.subscriptionId,
                accountId: assignment.accountId,
                profileId: assignment.profileId,
                subscription: {
                  id: sub.id,
                  client: clientRow ? { id: clientRow.id, name: clientRow.name } : null,
                  endDate: sub.endDate,
                  status: sub.status,
                },
              }
            : null,
        };
      });

      const usedProfiles = profiles.filter((p) => p.assignment !== null).length;

      const acctAssign = accountAssignmentMap.get(acc.id) ?? null;
      const acctSub = acctAssign ? subscriptionMap.get(acctAssign.subscriptionId) ?? null : null;
      const acctClient = acctSub ? (clientMap.get(acctSub.clientId) ?? null) : null;

      return {
        id: acc.id,
        serviceId: acc.serviceId,
        label: acc.label,
        email: acc.email ?? null,
        phone: acc.phone ?? null,
        supportsProfiles: acc.supportsProfiles,
        maxProfiles: acc.maxProfiles,
        usedProfiles,
        notes: acc.notes ?? null,
        isActive: acc.isActive,
        createdAt: acc.createdAt.toISOString(),
        updatedAt: acc.updatedAt.toISOString(),
        service: svc ? { id: svc.id, name: svc.name, logoUrl: svc.logoUrl ?? null } : null,
        profiles,
        accountAssignment: acctAssign && acctSub
          ? {
              id: acctAssign.id,
              subscriptionId: acctAssign.subscriptionId,
              accountId: acctAssign.accountId,
              profileId: null,
              subscription: {
                id: acctSub.id,
                client: acctClient ? { id: acctClient.id, name: acctClient.name } : null,
                endDate: acctSub.endDate,
                status: acctSub.status,
              },
            }
          : null,
      };
    })
  );

  const services: ServiceDto[] = serviceRows.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    description: s.description ?? null,
    logoUrl: s.logoUrl ?? null,
    isActive: s.isActive,
    showOnHomepage: s.showOnHomepage,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  const subscriptions: SubscriptionDto[] = subscriptionRows.map((s) => {
    const client = clientMap.get(s.clientId);
    return {
      ...s,
      client: client
        ? { id: client.id, name: client.name, email: client.email ?? null, phone: client.phone ?? null }
        : undefined,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  });

  return (
    <AccountsEditor initialData={accounts} services={services} subscriptions={subscriptions} />
  );
}
