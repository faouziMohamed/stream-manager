import type { Metadata } from 'next';
import LoginForm from './login-form';

export const metadata: Metadata = {
  title: 'Connexion',
  description: 'Connectez-vous à StreamManager pour gérer vos abonnements streaming.',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginForm />;
}
