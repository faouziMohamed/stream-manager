import { redirect } from 'next/navigation';

import { ROUTES } from '@/lib/config/routes';

/**
 * The settings hub had nothing to configure.
 *
 * Storage and mail are environment variables, media lives in the sidebar,
 * and sessions and users are their own destinations — so the page was a card
 * linking to a link. It redirects instead, which keeps old bookmarks working
 * without keeping a screen that only repeats the navigation.
 */
export default function SettingsPage() {
  redirect(ROUTES.console.settings.sessions);
}
