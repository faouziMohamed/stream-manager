import type { Metadata } from 'next';
import { Clock3, MessageSquareMore } from 'lucide-react';

import AuthStateCard from '@/app/(auth)/auth-state-card';
import { ROUTES } from '@/lib/config/routes';

export const metadata: Metadata = {
  title: 'Account pending approval',
  description: 'Account approval state for StreamManager.',
  robots: { index: false, follow: false },
};

export default function PendingApprovalPage() {
  return (
    <AuthStateCard
      badge="Pending approval"
      title="The account exists, but access is not active yet"
      description="Use this state when an operator account is waiting for manual approval."
      icon={Clock3}
      primaryAction={{
        href: ROUTES.auth.login,
        label: 'Contact support',
        icon: MessageSquareMore,
      }}
      details={[
        'This gives users a clear reason for blocked access instead of returning them to login without context.',
        'Approval copy should stay neutral and specific when the backend starts returning this state.',
      ]}
    />
  );
}
