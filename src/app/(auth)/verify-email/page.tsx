import type { Metadata } from 'next';
import { MailCheck, RotateCcw } from 'lucide-react';

import AuthStateCard from '@/app/(auth)/auth-state-card';
import { ROUTES } from '@/lib/config/routes';

export const metadata: Metadata = {
  title: 'Verify email',
  description: 'Email verification state for StreamManager.',
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <AuthStateCard
      badge="Email check"
      title="Confirm the account email before console access"
      description="This state keeps verification clear when email confirmation is introduced."
      icon={MailCheck}
      primaryAction={{
        href: ROUTES.auth.login,
        label: 'Return to login',
        icon: RotateCcw,
      }}
      secondaryAction={{
        href: ROUTES.auth.login,
        label: 'Contact support',
      }}
      details={[
        'The live version should include a resend action once the backend exposes verification mail delivery.',
        'The page should avoid dead ends for operators who verified from another device.',
      ]}
    />
  );
}
