import type { Metadata } from 'next';
import ContactForm from './contact-form';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contactez StreamManager — commande, question, ou support pour vos abonnements streaming.',
  openGraph: {
    title: 'Contact — StreamManager',
    description: 'Une question sur nos offres ? Contactez-nous.',
  },
};

export default function ContactPage() {
  return <ContactForm />;
}
