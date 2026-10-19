import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { ConsoleMetric } from '@/components/console/shared/console-metric';
import { ConsolePageHeader } from '@/components/console/shared/console-page-header';
import { ForbiddenScreen } from '@/components/shared/forbidden-screen';
import { loadUsers } from '@/features/users/server/loaders/users.loader';
import { UserList } from '@/features/users/ui/components/user-list';
import { getCurrentConsoleUser } from '@/lib/auth/current-user';

export const metadata: Metadata = {
  title: 'User Management | StreamManager',
  description: 'Manage system users and their roles',
};

export default async function UsersPage() {
  // The whole page is admin-only: listing users requires `requireAdmin`.
  const user = await getCurrentConsoleUser();

  if (user?.role !== 'admin') {
    return <ForbiddenScreen email={user?.email} role={user?.role} />;
  }

  const users = await loadUsers();

  if (users === null) {
    notFound();
  }

  const adminCount = users.filter((user) => user.role === 'admin').length;
  const accountantCount = users.filter((user) => user.role === 'accountant').length;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <ConsolePageHeader
        title="User Management"
        description="Manage operator identities, assign access levels, and keep privileged accounts visible before self-registration is enabled."
      />

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <ConsoleMetric label="Total users" value={String(users.length)} />
        <ConsoleMetric label="Admins" value={String(adminCount)} />
        <ConsoleMetric label="Accountants" value={String(accountantCount)} />
      </section>

      <div className="mt-6">
        <UserList initialUsers={users} />
      </div>
    </main>
  );
}
