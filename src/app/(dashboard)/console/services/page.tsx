import { getAllServices } from "@/lib/db/repositories/services.repository";
import { getDefaultCurrency } from "@/lib/db/repositories/analytics.repository";
import { ServicesEditor } from "@/components/console/cms/services-editor";
import type { ServiceDto } from "@/lib/graphql/operations/services.operations";

export default async function ServicesPage() {
  const [rows, currency] = await Promise.all([
    getAllServices(),
    getDefaultCurrency(),
  ]);
  const services: ServiceDto[] = rows.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));
  return <ServicesEditor initialData={services} defaultCurrency={currency} />;
}
