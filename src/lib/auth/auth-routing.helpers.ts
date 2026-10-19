import { ROUTES, ROUTE_PREFIXES } from '@/lib/config/routes';

export function buildLoginRedirectPath(interruptedPath: string): string {
  const params = new URLSearchParams({ next: resolveSafeCallbackPath(interruptedPath) });

  return `${ROUTES.auth.login}?${params.toString()}`;
}

export function resolveSafeCallbackPath(value: string | null | undefined): string {
  if (value === undefined || value === null || value.length === 0 || value.startsWith('//')) {
    return ROUTES.console.root;
  }

  try {
    const parsedUrl = new URL(value, 'https://streammanager.local');

    if (parsedUrl.origin !== 'https://streammanager.local') {
      return ROUTES.console.root;
    }

    const callbackPath = `${parsedUrl.pathname}${parsedUrl.search}`;

    if (!isConsolePath(callbackPath)) {
      return ROUTES.console.root;
    }

    return callbackPath;
  } catch {
    return ROUTES.console.root;
  }
}

function isConsolePath(path: string): boolean {
  return path === ROUTES.console.root || path.startsWith(`${ROUTE_PREFIXES.console}/`);
}
