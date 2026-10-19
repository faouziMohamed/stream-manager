import type { Metadata } from 'next';
import { KeyRound, Mail } from 'lucide-react';

import AuthStateCard from '@/app/(auth)/auth-state-card';
import { ROUTES } from '@/lib/config/routes';

export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Password recovery state for StreamManager.',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthStateCard
      badge="Recovery"
      title="Password recovery is reserved for the next auth batch"
      description="The page is scaffolded with the final shell, but the backend reset mutation is not exposed yet."
      icon={KeyRound}
      primaryAction={{
        href: ROUTES.auth.login,
        label: 'Contact support',
        icon: Mail,
      }}
      details={[
        'Operators can use support while password reset delivery is not wired.',
        'When the reset mutation lands, this page can become the email capture step without changing layout.',
      ]}
    />
  );
}
