import type { Metadata } from 'next';

import LoginForm from '@/app/(auth)/login/login-form';
import { resolveSafeCallbackPath } from '@/lib/auth/auth-routing.helpers';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to StreamManager to manage console operations.',
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const callbackUrl = resolveSafeCallbackPath(params.next);

  return <LoginForm callbackUrl={callbackUrl} />;
}
