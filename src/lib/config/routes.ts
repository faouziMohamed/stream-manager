/**
 * Centralised route definitions for the entire app.
 * Import from here — never hardcode paths in components or pages.
 */

// ── Public website ────────────────────────────────────────────────────────────
export const ROUTES = {
  // Public
  home: "/",
  contact: "/contact",

  // Auth
  auth: {
    login: "/auth/login",
    signup: "/auth/signup",
  },

  // Shared summary (public token link)
  summary: (token: string) => `/s/${token}`,

  // Console — root
  console: {
    root: "/console",

    // Management
    services: "/console/services",
    promotions: "/console/promotions",
    clients: "/console/clients",
    subscriptions: "/console/subscriptions",
    payments: "/console/payments",
    accounts: "/console/accounts",

    // Visualisation
    timeline: "/console/timeline",
    analytics: "/console/analytics",

    // Account
    summary: "/console/summary",

    // Inquiries / contact messages
    inquiries: "/console/inquiries",

    // Outils
    media: "/console/media",

    // Settings
    settings: {
      root: "/console/settings",
      smtp: "/console/settings/smtp",
      cloudinary: "/console/settings/cloudinary",
      notifications: "/console/settings/notifications",
    },
  },
} as const;

// ── Route prefix segments (used in proxy.ts for startsWith checks) ────────────
export const ROUTE_PREFIXES = {
  console: "/console",
  auth: "/auth/",
  sharedSummary: "/s/",
} as const;
