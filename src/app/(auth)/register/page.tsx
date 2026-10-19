import type { Metadata } from 'next';
import { MessageSquareMore, ShieldCheck } from 'lucide-react';

import AuthStateCard from '@/app/(auth)/auth-state-card';
import { ROUTES } from '@/lib/config/routes';

export const metadata: Metadata = {
  title: 'Request access',
  description: 'Self-registration is not enabled yet. Request access to StreamManager instead.',
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <AuthStateCard
      badge="Access by request"
      title="Self-registration is not open yet"
      description="StreamManager accounts are issued manually while console access is still controlled by approval."
      icon={ShieldCheck}
      primaryAction={{
        href: ROUTES.auth.login,
        label: 'Request access',
        icon: MessageSquareMore,
      }}
      details={[
        'Use the contact flow to request an operator account instead of creating an inactive profile.',
        'This route stays available so self-registration can be enabled later without changing the auth shell.',
      ]}
    />
  );
}
