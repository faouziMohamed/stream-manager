Build a comprehensive admin dashboard (at /console) for managing service subscriptions across multiple clients with timeline visualization, analytics, and role-based access (Admin + Read-only Accountant role). Built with Next.js 16 (App Router), GraphQL data transport, Drizzle ORM, and Better Auth.

Key Requirements
Core Domain Model
Services: Name, initial price, category, description, multiple plans (full/partial/custom)
Plans: Associated with services, pricing, plan type
Clients: Names and contact info
Subscriptions: Link client → plan with frequency (weekly/monthly) and status tracking
Payments: Track paid/unpaid/overdue status with due dates

User Roles & Authentication

    Admin: Full CRUD on all entities (you) — access /console
    Accountant: Read-only access to dashboard summary and analytics — access /console/summary (guest-accessible)
    Auth Methods: GitHub OAuth + password-based (via Better Auth)

Console Features (at /console/*)

    Authentication & Authorization
        Better Auth: GitHub OAuth + password sign-up/login
        Admin role enforcement via middleware at /console
        Middleware redirects unauthenticated users to /login

    Dashboard Overview (/console)
        Stats cards: Active subscriptions, total clients, monthly recurring revenue (MRR), overdue count, upcoming due (7 days)
        Quick actions sidebar

    Management Pages (Admin-only)
        /console/services — Create/edit/delete services, manage associated plans
        /console/clients — Create/edit/delete clients
        /console/subscriptions — Create/edit/delete subscriptions with status tracking
        /console/payments — Track payment status, mark as paid, view due dates
        /console/settings — Admin settings (future expansion)

    Timeline Visualization (/console/timeline)
        Switchable Views (stored in URL params):
            Gantt Chart: Services on Y-axis, time on X-axis, subscriptions as horizontal bars
            Table Grid: Services as columns, time periods (weeks/months) as rows with status badges
            Calendar: Month/week calendar with subscription status indicators
        Date range selector (month/year picker)
        View toggle buttons

    Analytics & Charts (/console/analytics)
        Monthly revenue evolution (Recharts line chart)
        Payment status breakdown (paid vs unpaid over time, stacked bar)
        Subscription count by service (bar chart)
        Time period selector (week/month/quarter view)

    Read-only Accountant Summary (/console/summary)
        Guest-accessible, no auth required (or share-link protected)
        Key metrics: MRR, active subscriptions, payment status
        Charts (same as admin but read-only)
        No edit buttons or links

Technical Stack
Aspect	Choice
Framework	Next.js 16 (App Router)
Language	TypeScript (strict mode)
Database	PostgreSQL (external, Aiven)
ORM	Drizzle ORM
Authentication	Better Auth (GitHub OAuth + password)
Data Transport	GraphQL (only REST: /api/auth/[...all])
Data Fetching	TanStack React Query v5
Charts	Recharts
UI/Styling	Shadcn/ui + Tailwind CSS v4
Forms	react-hook-form + zod v4
Logging	Pino (server) + clientLogger (client)
File Naming	Domain-suffixed: .table.ts, .repository.ts, .schema.ts, .resolvers.ts, .operations.ts, .queries.ts
Database Schema
Drizzle Table Definitions

/src/lib/db/tables/:
auth.table.ts — Better Auth tables (user, session, account, verification)
subscription-management.table.ts — services, plans, clients, subscriptions, payments

Here an initial tough of Tables Structure but feel free to adjust as needed based on your implementation approach:
-- Users (managed by BetterAuth)
users (id, email, name, emailVerified, image, role, createdAt, updatedAt)

-- Services
services (id, name, price DECIMAL, category TEXT, description TEXT, createdAt, updatedAt)

-- Plans (associated with services)
plans (id, serviceId FK, name TEXT, price DECIMAL, planType ENUM('full', 'partial', 'custom'), description TEXT, createdAt, updatedAt)

-- Clients
clients (id, name TEXT, email TEXT, createdAt, updatedAt)

-- Subscriptions (client → plan link with frequency & status)
subscriptions (id, clientId FK, planId FK, startDate DATE, endDate DATE NULL, frequency ENUM('weekly', 'monthly'), status ENUM('active', 'paused', 'cancelled'), createdAt, updatedAt)

-- Payments (auto-generated when subscription created, recurring)
payments (id, subscriptionId FK, dueDate DATE, paidDate DATE NULL, amount DECIMAL, status ENUM('paid', 'unpaid', 'overdue'), createdAt, updatedAt)
Directory Structure (Following claude.md Pattern)


here also a plan for the directory structure of the project, following the conventions outlined in the requirements, but feel free to adjust as needed based on your implementation approach:
src/
├── app/
│   ├── (website)/                    # Public pages (future)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── (dashboard)/console/          # Admin console (protected by middleware)
│   │   ├── layout.tsx                # Console shell (sidebar + topbar)
│   │   ├── page.tsx                  # Dashboard overview
│   │   ├── services/                 # Service management
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── clients/                  # Client management
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── subscriptions/            # Subscription management
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── payments/                 # Payment tracking
│   │   │   └── page.tsx
│   │   ├── timeline/                 # Timeline visualization
│   │   │   └── page.tsx
│   │   ├── analytics/                # Analytics dashboard
│   │   │   └── page.tsx
│   │   ├── summary/                  # Read-only accountant summary (optional auth)
│   │   │   └── page.tsx
│   │   └── settings/                 # Admin settings
│   │       └── page.tsx
│   ├── auth/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── api/
│   │   ├── graphql/route.ts          # graphql-yoga handler (GET + POST)
│   │   └── auth/[...all]/route.ts    # BetterAuth — do NOT add routes here
│   ├── layout.tsx                    # Root layout + Providers
│   ├── globals.css
│   └── error.tsx / not-found.tsx / robots.ts / sitemap.ts
├── components/
│   ├── ui/                           # shadcn/ui primitives — DO NOT edit
│   ├── shared/                       # Shared across console
│   │   ├── providers.tsx             # React Query + session providers
│   │   ├── theme-provider.tsx        # next-themes wrapper
│   │   └── auth-context.tsx          # Session context (Better Auth)
│   └── console/                      # Console-specific components
│       ├── console-sidebar.tsx
│       ├── console-topbar.tsx
│       ├── management/               # Management editors & stats
│       │   ├── services-editor.tsx   / services-stats.tsx
│       │   ├── clients-editor.tsx    / clients-stats.tsx
│       │   ├── subscriptions-editor.tsx / subscriptions-stats.tsx
│       │   └── payments-editor.tsx   / payments-stats.tsx
│       └── timeline/                 # Timeline view components
│           ├── gantt-chart.tsx
│           ├── table-grid.tsx
│           ├── calendar-view.tsx
│           └── view-selector.tsx
├── lib/
│   ├── auth/                         # Better Auth config + helpers
│   │   ├── config.ts                 # Better Auth setup (GitHub + password)
│   │   └── helpers.ts                # isAdmin, isAccountant checks
│   ├── db/
│   │   ├── schema.ts                 # Barrel re-export
│   │   ├── tables/
│   │   │   ├── auth.table.ts         # BetterAuth tables
│   │   │   └── subscription-management.table.ts # services, plans, clients, subscriptions, payments
│   │   └── repositories/
│   │       ├── services.repository.ts
│   │       ├── clients.repository.ts
│   │       ├── subscriptions.repository.ts
│   │       ├── payments.repository.ts
│   │       └── analytics.repository.ts
│   ├── graphql/
│   │   ├── schema.ts                 # Merges SDL slices
│   │   ├── schema/
│   │   │   ├── scalars.schema.ts
│   │   │   ├── services.schema.ts
│   │   │   ├── clients.schema.ts
│   │   │   ├── subscriptions.schema.ts
│   │   │   ├── payments.schema.ts
│   │   │   ├── analytics.schema.ts
│   │   │   ├── query.schema.ts
│   │   │   └── mutation.schema.ts
│   │   ├── resolvers/
│   │   │   ├── index.ts              # Merges all slices
│   │   │   ├── services.resolvers.ts
│   │   │   ├── clients.resolvers.ts
│   │   │   ├── subscriptions.resolvers.ts
│   │   │   ├── payments.resolvers.ts
│   │   │   └── analytics.resolvers.ts
│   │   ├── context.ts                # Per-request auth context
│   │   ├── client.ts                 # graphql-request client
│   │   ├── operations.ts             # Barrel re-export
│   │   └── operations/
│   │       ├── services.operations.ts
│   │       ├── clients.operations.ts
│   │       ├── subscriptions.operations.ts
│   │       ├── payments.operations.ts
│   │       └── analytics.operations.ts
│   ├── hooks/queries/
│   │   ├── use-services.queries.ts
│   │   ├── use-clients.queries.ts
│   │   ├── use-subscriptions.queries.ts
│   │   ├── use-payments.queries.ts
│   │   └── use-analytics.queries.ts
│   ├── settings/
│   │   ├── env.ts                    # @t3-oss/env-nextjs validation
│   │   └── config.ts                 # App config
│   ├── types.ts                      # Shared types
│   ├── logger/
│   │   ├── logger.ts                 # Pino logger (server)
│   │   ├── client-logger.ts          # Client logger
│   │   └── client-log.action.ts      # Server Action for client logs
│   └── utils/                        # Helpers, cn(), calculations
├── proxy.ts                     # Auth + role-based route protection
├── drizzle.config.ts
└── env.example                       # Example env vars

scripts/
├── seed.ts                           # Database seeding
└── migrate.ts                        # Drizzle migrations

the claude.md file passed on the context is a file you must be inspired for the arch and guidline but after you finish the work edit it to reflect this project


GraphQL-Only Architecture
API Routes
Route	Method	Purpose
/api/graphql	GET	GraphQL playground (dev mode only)
/api/graphql	POST	GraphQL query/mutation
/api/auth/[...all]	*	Better Auth (do not touch)
Data Flow

    Server Page → fetches initialData directly from repositories → passes to client
    Client Component → renders with initialData, hydrates React Query
    User Interaction → triggers React Query mutation → GraphQL POST to /api/graphql
    Mutation Resolver → queries DB via repository → returns updated data
    React Query Hook → optimistic update, error rollback, invalidation

GraphQL Resolver Auth Guards

    Every resolver checks ctx.isAdmin / ctx.isAccountant
    Admin mutations throw GraphQLError(FORBIDDEN) if user not admin
    Accountant queries allowed but mutations blocked

Implementation Phases
Phase 1: Foundation (Database + Auth + GraphQL Setup)

    Set up Drizzle ORM with schema and migrations for subscription management
    Configure Better Auth with GitHub OAuth + password auth
    Create auth middleware at /console (admin role enforcement)
    Build GraphQL server with schema + context
    Create auth pages (/login, /signup)
    Deliverable: Authenticated admin access to /console with proper role checking

Phase 2: Repositories & Data Layer (Services, Clients, Subscriptions, Payments)

    Build repositories: services, clients, subscriptions, payments, analytics
    Write GraphQL schemas (types, queries, mutations) for all domains
    Implement resolvers with auth guards (admin-only mutations, accountant read-only queries)
    Create React Query hooks with optimistic updates
    Deliverable: All CRUD operations work via GraphQL, fully typed

Phase 3: Management Pages & Forms (Admin CRUD Interfaces)

    Dashboard overview page with stats (active subscriptions, MRR, overdue counts)
    Services management (list + create/edit/delete forms)
    Clients management (list + create/edit/delete forms)
    Subscriptions management (list + create/edit/delete forms, auto-generate payments)
    Payments page (list, mark as paid/unpaid)
    Deliverable: Full admin console CRUD functionality

Phase 4: Timeline & Analytics Views

    Timeline resolver calculations (date ranges, subscription data)
    Analytics resolver (MRR, payment status breakdown, subscription counts by service)
    Recharts visualizations (line chart for revenue, stacked bar for payments, bar chart for subscriptions)
    Timeline page with view selector (Gantt chart / table grid / calendar views)
    Analytics page with date range controls and charts
    Deliverable: /console/timeline and /console/analytics pages fully functional

Phase 5: Read-only Accountant Page & Security Polish

    Read-only summary page (/console/summary) with key metrics and charts
    UI refinements and responsive design across all pages
    Error boundaries, loading states, and empty state components
    Security review: input validation, rate limiting, CORS headers, environment variable handling
    Deliverable: Production-ready subscription management dashboard

Security Considerations
Authentication & Authorization

    Better Auth middleware validates session on every request
    /console routes protected by middleware → redirect to /login if unauthenticated
    Role check in middleware → redirect non-admin to /console/summary or sign-out
    GraphQL context extracts userId + isAdmin from session
    GitHub OAuth + password signup/login via Better Auth

Data Protection

    Sensitive operations (mutations) require admin role in resolver
    Accountant read-only access via separate query types or field-level filtering
    No direct DB access from client components → all via GraphQL
    Environment variables via @t3-oss/env-nextjs with strict validation
    Database connection string never exposed to client

Input Validation

    GraphQL schema enforces type safety
    Zod validation in react-hook-form on client
    Resolver-side validation before DB operations
    SQL injection prevention via Drizzle ORM parameterized queries

CSRF & CORS

    Same-origin GraphQL requests (no external clients)
    Better Auth handles CSRF for login/logout

Key Technical Decisions

    GraphQL-Only Data Transport: All client ↔ server communication via GraphQL (except auth routes)
    Server-Side Rendering: Use Server Components for initial page load, hydrate with React Query
    Optimistic Updates: Every mutation includes optimistic UI update + rollback on error
    Timezone Handling: Store all dates in UTC, format in browser using native Intl APIs
    Timeline Granularity: Auto-select week/month based on date range (< 12 weeks → weeks; else months)
    Payment Automation: Create recurring payment records when subscription is created (batch job or on-demand)
    Overdue Calculation: payment.dueDate < today AND payment.status = 'unpaid'
    Upcoming Due: payment.dueDate BETWEEN today AND today + 7 days AND payment.status = 'unpaid'
    Architecture Pattern: Follow claude.md conventions: domain-suffixed file names, RSC by default, GraphQL as sole data transport, React Query for client-side state

File Naming Convention

Following the claude.md pattern for subscription management domain:
Domain type	Suffix	Example
DB table definitions	.table.ts	subscription-management.table.ts
DB repositories	.repository.ts	services.repository.ts
GraphQL resolvers	.resolvers.ts	services.resolvers.ts
GraphQL SDL slices	.schema.ts	services.schema.ts
GraphQL operations	.operations.ts	services.operations.ts
React Query hooks	.queries.ts	use-services.queries.ts
Constraints & Considerations

    Single admin user with optional accountant role for read-only access
    No external API integrations — all data manually entered by admin
    Timeline views calculate on-the-fly from start/end dates and frequency
    Payment records auto-generated per billing cycle (weekly/monthly) when subscription created
    Console layout includes sidebar nav + topbar (similar to claude.md pattern)
    Accountant summary page can be guest-accessible (no auth) or behind optional token-based sharing
    All dates stored in UTC; display in user's local timezone via browser APIs
    Middleware protects /console/* routes with auth + role checks
    Follow React Compiler compatibility patterns (no memoization anti-patterns)
    Never use raw fetch() from client components — always use typed React Query hooks
    No new REST routes — GraphQL is the sole data transport (except auth)


BEFORE YOU TYPE
- Turn on Extended Thinking


Some example of subscription my clients might have:

✅ Promotion Netflix + Shahid vip + Prime Video : (here I'm using the MAD (DH - Dirham) currency for the prices so it should be the default one, but the default currency can be changed in the future if needed on the settings page and every table you save a price save also it currency code to be able to display it correctly in the future if needed)

1 mois = 69 dh
2 mois = 139 dh
3 mois = 199 dh

✅ Abonnement Netflix :
1 mois = 39 DH
2 mois = 79 DH
3 mois = 119 DH
4 mois = 149 DH
6 mois = 220 DH

✅ Abonnement Shahid vip :
3 mois = 89 DH
4 mois = 119 DH
6 mois = 149 DH
12mois = 249 DH

✅ Abonnement Disney+ :
1 mois = 39 DH
2 mois = 79 DH
3 mois = 119 DH
4 mois = 149 DH
6 mois = 220 DH

✅ Abonnement Prime video :
1 mois = 35 DH
2 mois = 69 DH
3 mois = 100 DH
4 mois = 129 DH
6 mois = 199 DH

✅ Abonnement Spotify :
1 mois = 39 DH
3 mois = 99 DH
6 mois = 159 DH

✅ Promotion Netflix + Prime video :
1 mois = 55 dh
2 mois = 99 dh
3 mois = 149 dh
6 mois = 279 dh


You can get inspired by these examples to create the services, plans, clients, subscriptions, and payments in the database. Each service can have multiple plans with different pricing and durations. Clients can subscribe to these plans, and payments can be tracked based on the subscription details.

Make sure to have non dashboard page to display some offers and promotions to the clients, and also a contact page for them to reach out to you if they have any questions or need support.


This project i'm using has just been generate you can edit it however you want, just make sure it works.
After you make your plan make sure to wait for me to give you any clarification or approval before you start coding, and also after you finish the code make sure to edit the claude.md file to reflect the new architecture and guidelines of this project.
