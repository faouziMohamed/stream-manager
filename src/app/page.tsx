import { redirect } from 'next/navigation';

import { ROUTES } from '@/lib/config/routes';

// Backoffice-only: the root path leads straight to the console. Unauthenticated
// visitors are redirected to sign-in by the auth middleware.
export default function RootHomePage() {
  redirect(ROUTES.console.root);
}
