import type { Metadata } from 'next';
import { KeyRound, LockKeyhole } from 'lucide-react';

import AuthStateCard from '@/app/(auth)/auth-state-card';
import { ROUTES } from '@/lib/config/routes';

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Password reset state for StreamManager.',
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthStateCard
      badge="Reset token"
      title="Use a reset link to choose a new password"
      description="This state is ready for token-based recovery once the API supports password reset."
      icon={LockKeyhole}
      primaryAction={{
        href: ROUTES.auth.login,
        label: 'Back to login',
        icon: KeyRound,
      }}
      secondaryAction={{
        href: ROUTES.auth.login,
        label: 'Contact support',
      }}
      details={[
        'The final version should validate the reset token before rendering password fields.',
        'Password and confirmation errors must stay inline when the reset mutation is added.',
      ]}
    />
  );
}
