import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';
import { loadCustomer } from '@/features/customers/server/loaders/customers.loader';
import { loadCustomerHub } from '@/features/customers/server/loaders/customer-hub.loader';
import { CustomerDetail } from '@/features/customers/ui/components/customer-detail';
import { CustomerDocuments } from '@/features/customers/ui/components/customer-documents';
import { CustomerPaymentHistory } from '@/features/customers/ui/components/customer-payment-history';
import { CustomerSubscriptions } from '@/features/customers/ui/components/customer-subscriptions';
import { isCurrentUserAdmin } from '@/lib/auth/current-user';
import { ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const [customer, hub, canManage] = await Promise.all([
    loadCustomer(id),
    loadCustomerHub(id),
    isCurrentUserAdmin(),
  ]);

  if (customer === null) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6">
        <Link
          href={ROUTES.console.customers}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'gap-2 text-(--sm-muted) hover:text-(--sm-fg)'
          )}
        >
          <ArrowLeft className="size-4" />
          Customers
        </Link>
      </div>

      <header className="mb-8 flex flex-col gap-5 border-b border-(--sm-border) pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="sm-title text-3xl font-semibold tracking-tight">{customer.name}</h1>
          <p className="sm-subtitle mt-2 text-sm">{customer.businessId}</p>
        </div>
      </header>

      <CustomerDetail canManage={canManage} customer={customer} />
      <div className="mt-10">
        <CustomerPaymentHistory currencyCode="MAD" series={hub.history} />
      </div>
      <CustomerSubscriptions canManage={canManage} customerId={customer.id} initialHub={hub} />
      <div className="mt-10">
        <CustomerDocuments customerId={customer.id} initialHub={hub} />
      </div>
    </main>
  );
}

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};
