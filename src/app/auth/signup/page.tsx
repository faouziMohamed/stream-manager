import type { Metadata } from 'next';
import SignupForm from './signup-form';

export const metadata: Metadata = {
  title: 'Inscription',
  description: 'Créez un compte StreamManager pour gérer vos abonnements streaming.',
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return <SignupForm />;
}
