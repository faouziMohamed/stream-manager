# CLAUDE.md — Agent Instructions for stream.mfaouzi.com

Authoritative rules for **StreamManager** — a subscription management dashboard for streaming service resellers.

---

## Project Overview

| Attribute        | Value                                                        |
|------------------|--------------------------------------------------------------|
| App name         | StreamManager                                                |
| Framework        | Next.js 16 (App Router)                                      |
| Language         | TypeScript (strict mode)                                     |
| Styling          | Tailwind CSS v4 + shadcn/ui                                  |
| Forms            | react-hook-form + zod v4                                     |
| React Compiler   | Enabled (`babel-plugin-react-compiler`)                      |
| Node required    | ≥ 24.0.0                                                     |
| GraphQL server   | graphql-yoga at `/api/graphql`                               |
| GraphQL client   | graphql-request (no Apollo)                                  |
| Data fetching    | TanStack React Query v5                                      |
| Auth             | BetterAuth at `/api/auth/[...all]` — do not touch            |
| Database         | PostgreSQL (Aiven) via Drizzle ORM (`postgres` driver)       |
| Default currency | MAD (Moroccan Dirham, symbol: DH) — configurable in settings |
| Charts           | Recharts                                                     |
| Logging          | Pino (server) + clientLogger (client)                        |

---

## Workflow Rules (non-negotiable)

1. **Plan before coding** — describe approach and wait for approval before writing code.
2. **Clarify ambiguity** — ask questions before writing code when requirements are unclear.
3. **Post-code review** — after writing code, list edge cases and suggest test cases.
4. **Limit scope** — if a task touches more than 3 files, break it into smaller tasks first.
5. **Bug-fix workflow** — write a reproducing test first, then fix until the test passes.
6. **Never use `cat`/shell redirection to write files** — use IDE file-edit tools.
7. **Prefer file tools over CLI for reading** — `read_file`, `list_dir`, `file_search`, `grep_search` are reliable and
   tracked. Use CLI (`cat`, `grep`, `ls`, etc.) only as a **fallback** when a file tool cannot accomplish the task (e.g.
   `npm install`, running migrations, checking process output). If CLI returns empty output, fall back to file tools
   immediately.
8. **No new REST routes** — every new server operation must be a GraphQL query or mutation. The only REST routes are
   BetterAuth at `/api/auth/[...all]`. Do not create `route.ts` files outside `api/auth/` and `api/graphql/`.
9. **Never call `router.refresh()` after mutations** — optimistic updates + `invalidateQueries` handle UI sync.
10. **Always use the `env` object** — `import { env } from '@/lib/settings/env'` for every env var access; never use
    `process.env.*` directly in application code.
11. **Use the logger everywhere** — server: `createLogger('module')` from `@/lib/logger`; client:
    `clientLogger('module')` from `@/lib/logger/client-logger`. Never use `console.*`.

---

## Stack & Path Aliases

| Alias | Resolves to |
|-------|-------------|
| `@/*` | `src/*`     |

- Styling: Tailwind v4 utilities + `cn()` from `@/lib/utils/helpers`
- Components: RSC by default; `'use client'` only when state/effects needed
- Types: strict TypeScript, `import type` for type-only imports, no `any`
- Env vars: validated with `@t3-oss/env-nextjs` in `src/lib/settings/env.ts` — always add to both schema and
  `runtimeEnv`
- Currency: every price column stores an adjacent `currencyCode TEXT NOT NULL DEFAULT 'MAD'`; use `formatCurrency()`
  from `@/lib/utils/helpers`
- UI primitives: `src/components/ui/` (shadcn/ui) — avoid editing unless necessary

---

## Domain Model

| Table                | Key fields                                                                    |
|----------------------|-------------------------------------------------------------------------------|
| `users`              | BetterAuth user table + `role` enum (`admin`/`accountant`/`user`)             |
| `services`           | name, category, description, logoUrl, isActive                                |
| `promotions`         | name, description, isActive (bundle of services)                              |
| `promotion_services` | promotionId FK, serviceId FK (junction)                                       |
| `plans`              | name, durationMonths, price, currencyCode, planType, serviceId OR promotionId |
| `clients`            | name, email, phone, notes, isActive                                           |
| `subscriptions`      | clientId, planId, startDate, endDate, isRecurring, status, renewedFromId      |
| `payments`           | subscriptionId, dueDate, paidDate, amount, currencyCode, status               |
| `app_settings`       | key-value store (defaultCurrency, etc.)                                       |
| `summary_links`      | short shareable tokens for read-only accountant summary                       |
| `contact_inquiries`  | public contact form submissions                                               |

### Key business rules

- A plan belongs to **either** a `serviceId` OR a `promotionId` (never both)
- `subscription.endDate = startDate + plan.durationMonths` (computed on create)
- `payment.status = 'overdue'` when `dueDate < today AND status = 'unpaid'`
- On renewal: create a new subscription (`renewedFromId = old id`) + new payment
- `isRecurring = true` means the UI suggests renewal on expiry (not auto-charged)

---

## Directory Structure

```
src/
├── app/
│   ├── (website)/                    # Public pages
│   │   ├── layout.tsx                # Public nav + footer
│   │   ├── page.tsx                  # Offers/promotions landing
│   │   └── contact/page.tsx          # Contact form
│   ├── (dashboard)/console/          # Admin console (auth-protected by middleware)
│   │   ├── layout.tsx                # Sidebar + topbar shell
│   │   ├── page.tsx                  # Dashboard overview (stats cards)
│   │   ├── services/page.tsx
│   │   ├── promotions/page.tsx
│   │   ├── clients/page.tsx
│   │   ├── subscriptions/page.tsx
│   │   ├── payments/page.tsx
│   │   ├── timeline/page.tsx         # Gantt / Table Grid / Calendar views
│   │   ├── analytics/page.tsx        # Revenue & payment charts
│   │   ├── summary/page.tsx          # Summary link manager (admin)
│   │   └── settings/page.tsx         # Default currency + other settings
│   ├── auth/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── s/[token]/page.tsx            # Public shared summary (Phase 5)
│   ├── api/
│   │   ├── graphql/route.ts          # graphql-yoga (GET + POST)
│   │   └── auth/[...all]/route.ts    # BetterAuth — do NOT touch
│   ├── layout.tsx                    # Root layout + Providers
│   └── globals.css
├── components/
│   ├── ui/                           # shadcn/ui primitives — DO NOT edit
│   ├── shared/
│   │   ├── providers.tsx             # React Query + ThemeProvider
│   │   └── theme-provider.tsx
│   ├── console/
│   │   ├── console-sidebar.tsx
│   │   ├── console-topbar.tsx
│   │   └── cms/                      # Page-specific editors & stats
│   └── website/                      # Public page components
├── lib/
│   ├── auth/
│   │   ├── auth.ts                   # BetterAuth config (GitHub + password)
│   │   ├── auth-client.ts            # BetterAuth client (browser)
│   │   └── helpers.ts                # isAdmin(), isAccountant()
│   ├── db/
│   │   ├── index.ts                  # Drizzle client (postgres driver + SSL)
│   │   ├── schema.ts                 # Barrel re-export
│   │   ├── tables/
│   │   │   ├── auth.table.ts
│   │   │   └── subscription-management.table.ts
│   │   └── repositories/             # DB query functions (Phase 2+)
│   ├── graphql/
│   │   ├── schema.ts                 # Merges all SDL slices
│   │   ├── resolvers.ts              # 1-line re-export shim
│   │   ├── context.ts                # Per-request auth context
│   │   ├── client.ts                 # graphql-request client
│   │   ├── operations.ts             # Barrel re-export
│   │   ├── schema/                   # SDL slices per domain
│   │   ├── resolvers/                # Resolver slices per domain
│   │   └── operations/               # Typed GQL operations per domain
│   ├── hooks/queries/                # React Query hooks (Phase 2+)
│   ├── settings/
│   │   ├── env.ts                    # @t3-oss/env-nextjs validation
│   │   └── config.ts                 # App config (name, default currency)
│   ├── logger/
│   │   ├── index.ts
│   │   ├── logger.ts                 # Pino (server)
│   │   ├── client-logger.ts          # Client logger
│   │   └── client-log.action.ts      # Server Action — forwards client logs
│   └── utils/
│       ├── helpers.ts                # cn(), formatCurrency(), slugify()
│       └── date-utils.ts             # addMonths(), computeEndDate(), isOverdue()
├── middleware.ts                     # Auth + role-based route protection
└── drizzle.config.ts
```

---

## File Naming Convention

| Domain type        | Suffix           | Examples                                             |
|--------------------|------------------|------------------------------------------------------|
| DB table defs      | `.table.ts`      | `auth.table.ts`, `subscription-management.table.ts`  |
| DB repositories    | `.repository.ts` | `services.repository.ts`, `payments.repository.ts`   |
| GraphQL resolvers  | `.resolvers.ts`  | `services.resolvers.ts`, `analytics.resolvers.ts`    |
| GraphQL SDL slices | `.schema.ts`     | `services.schema.ts`, `mutation.schema.ts`           |
| GraphQL operations | `.operations.ts` | `services.operations.ts`, `analytics.operations.ts`  |
| React Query hooks  | `.queries.ts`    | `use-services.queries.ts`, `use-payments.queries.ts` |

---

## User Roles & Authentication

| Role         | Access                                                  |
|--------------|---------------------------------------------------------|
| `admin`      | Full CRUD on all entities, all console routes           |
| `accountant` | Read-only: dashboard stats, analytics, summary          |
| `user`       | Default after signup — no console access until promoted |

- Middleware at `src/middleware.ts` checks session cookie for `/console/*` routes
- Role enforcement happens server-side in GraphQL resolvers via `ctx.isAdmin` / `ctx.isAccountant`
- Use `requireAdmin(ctx)` / `requireAuth(ctx)` from `resolvers/guards.ts`

---

## Data Transport

- **GraphQL only** for all client → server data operations (`POST /api/graphql`)
- **No new REST routes** — only BetterAuth at `/api/auth/[...all]` is REST
- Client: `gqlRequest()` from `src/lib/graphql/client.ts`
- Operations (typed): `src/lib/graphql/operations.ts` (barrel)
- Hooks: `src/lib/hooks/queries/` — React Query wrapping GraphQL with optimistic updates

---

## Console Pages Pattern

1. **Server page** — fetches `initialData` from DB repository, passes as props
2. **Stats component** — `'use client'`, same React Query key as editor
3. **Editor component** — `'use client'`, `react-hook-form` + optimistic mutation

---

## React Query

- Every mutation: `onMutate` (optimistic) → `onError` (rollback) → `onSettled` (invalidate)
- Use `initialData` from server page — no loading state on first render
- Never call `router.refresh()` after mutations

---

## Forms

- Always `react-hook-form` + `zod` + `zodResolver`
- Always display errors inline with `text-destructive`
- Always pass `onInvalid` to `handleSubmit(onSubmit, onInvalid)`
- Never spread DTO objects into `defaultValues`

---

## Currency Handling

- Default currency: `MAD` (stored in `app_settings` as key `defaultCurrency`)
- Every price value is stored with an adjacent `currencyCode` column
- Changing the default currency only affects **new** prices — existing records keep their stored currency
- Use `formatCurrency(amount, currencyCode)` from `@/lib/utils/helpers` for display

---

## Console Routes

| Path                     | Description                                      |
|--------------------------|--------------------------------------------------|
| `/console`               | Dashboard overview (stats cards)                 |
| `/console/services`      | Service CRUD                                     |
| `/console/promotions`    | Promotion/bundle CRUD                            |
| `/console/clients`       | Client CRUD                                      |
| `/console/subscriptions` | Subscription management + renewal                |
| `/console/payments`      | Payment tracking, mark as paid                   |
| `/console/timeline`      | Gantt / Table Grid / Calendar timeline views     |
| `/console/analytics`     | Revenue charts, payment breakdown, service stats |
| `/console/summary`       | Summary link manager (generate shareable links)  |
| `/console/settings`      | App settings (default currency, etc.)            |
| `/s/[token]`             | Public shared summary (accountant read-only)     |
| `/auth/login`            | Login (email + GitHub OAuth)                     |
| `/auth/signup`           | Sign up                                          |
| `/`                      | Public offers/promotions landing page            |
| `/contact`               | Public contact form                              |

---

## Implementation Status

| Phase | Status     | Description                                                                             |
|-------|------------|-----------------------------------------------------------------------------------------|
| 1     | ✅ Complete | Foundation: DB schema, BetterAuth, GraphQL server, middleware, auth pages, public pages |
| 2     | ✅ Complete | Repositories + full GraphQL resolvers + React Query hooks for all domains               |
| 3     | ✅ Complete | Management pages + Timeline + Analytics + Summary + Shared link — all in French         |
| 4     | ✅ Complete | Timeline (Gantt/Grid/Calendar) + Analytics (Recharts charts) views                      |
| 5     | ✅ Complete | Shared summary page (/s/[token]) + settings + polish + all TS errors resolved           |
