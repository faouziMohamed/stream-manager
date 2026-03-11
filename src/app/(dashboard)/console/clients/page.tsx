import { getAllClients } from "@/lib/db/repositories/clients.repository";
import { countActiveSubscriptionsByClient } from "@/lib/db/repositories/subscriptions.repository";
import { ClientsEditor } from "@/components/console/cms/clients-editor";
import type { ClientDto } from "@/lib/graphql/operations/clients.operations";

export default async function ClientsPage() {
  const rows = await getAllClients();
  const clients: ClientDto[] = await Promise.all(
    rows.map(async (c) => ({
      ...c,
      activeSubscriptionsCount: await countActiveSubscriptionsByClient(c.id),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  );
  return <ClientsEditor initialData={clients} />;
}
