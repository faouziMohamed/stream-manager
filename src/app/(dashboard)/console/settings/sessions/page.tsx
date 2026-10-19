import type { Metadata } from 'next';

import { ConsolePageHeader } from '@/components/console/shared/console-page-header';
import { listSessionsAction } from '@/features/sessions/server/actions/list-sessions.action';
import { SessionsConsole } from '@/features/sessions/ui/components/sessions-console';

export const metadata: Metadata = {
  title: 'Active Sessions | StreamManager',
  description: 'Review signed-in devices and revoke access',
};

export default async function SessionsPage() {
  const sessions = await listSessionsAction();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <ConsolePageHeader
        title="Active sessions"
        description="Every signed-in device holds a session. Revoke any session to immediately block its access on the next request."
      />

      <section className="mt-6">
        <SessionsConsole initialData={sessions} />
      </section>
    </main>
  );
}
