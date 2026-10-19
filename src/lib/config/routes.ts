export const ROUTES = {
  home: '/',
  forbidden: '/forbidden',
  notFound: '/not-found',
  auth: {
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    verifyEmail: '/verify-email',
    pendingApproval: '/pending-approval',
  },
  console: {
    root: '/console',
    customers: '/console/customers',
    customerDetail: (id: string) => `/console/customers/${id}`,
    services: '/console/services',
    serviceDetail: (id: string) => `/console/services/${id}`,
    memberships: '/console/memberships',
    membershipDetail: (id: string) => `/console/memberships/${id}`,
    // The guided one-screen flow. Called "subscription" in the UI; the entity
    // behind it is still Membership (GraphQL reserves `Subscription`).
    newSubscription: '/console/subscriptions/new',
    payments: '/console/payments',
    streamingAccounts: '/console/streaming-accounts',
    streamingAccountDetail: (id: string) => `/console/streaming-accounts/${id}`,
    plans: '/console/plans',
    planDetail: (id: string) => `/console/plans/${id}`,
    timeline: '/console/timeline',
    analytics: '/console/analytics',
    summary: '/console/summary',
    media: '/console/media',
    settings: {
      root: '/console/settings',
      sessions: '/console/settings/sessions',
    },
    users: '/console/users',
  },
} as const;

export const ROUTE_PREFIXES = {
  console: '/console',
  auth: '/login',
} as const;
