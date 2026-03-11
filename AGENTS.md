# AGENTS.md — Universal AI Agent Instructions for stream.mfaouzi.com

> This file is the universal entry point for **any** AI agent (Claude, Copilot, Cursor, Windsurf, Gemini, GPT,
> etc.). The authoritative and complete set of rules lives in **`CLAUDE.md`** — always read that file first.
> This file provides orientation and cross-agent conventions.

---

## What is this project?

**StreamManager** — a subscription management dashboard for streaming service resellers.

| Layer            | Technology                                                   |
| ---------------- | ------------------------------------------------------------ |
| App name         | StreamManager                                                |
| Framework        | Next.js 16 — App Router                                      |
| Language         | TypeScript (strict)                                          |
| Styling          | Tailwind CSS v4 + shadcn/ui                                  |
| Forms            | react-hook-form + zod v4                                     |
| React Compiler   | Enabled (`babel-plugin-react-compiler`)                      |
| Data             | TanStack React Query v5 + GraphQL (yoga/request)             |
| Database         | PostgreSQL (Aiven) via Drizzle ORM (`postgres` driver)       |
| Auth             | BetterAuth (`/api/auth/[...all]`) — do not touch             |
| Default currency | MAD (Moroccan Dirham, symbol: DH) — configurable in settings |
| Charts           | Recharts                                                     |
| Logging          | Pino (server) + clientLogger (client)                        |
| Node             | ≥ 24.0.0                                                     |

---

## Quick-Start for Agents

1. **Read `CLAUDE.md`** — it contains the full directory structure, conventions, workflow rules, and agent skills.
2. **Understand the client/server boundary:**
   - Server Components → call DB repositories directly (no HTTP)
   - Client Components → call React Query hooks backed by GraphQL only
3. **All data mutations go through GraphQL** — no new REST routes, no raw `fetch()` from client code.
4. **Never modify** `src/components/ui/` or `src/app/api/auth/` without explicit user approval.
5. **Use centralized routes** — import from `src/lib/config/routes.ts` (`ROUTES`, `ROUTE_PREFIXES`), never hardcode paths.

---

## Non-Negotiable Rules (all agents)

| #   | Rule                                                                                                                                                                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Plan before coding** — describe your approach, wait for approval                                                                                                                                                                                                                              |
| 2   | **Clarify ambiguity** — ask before writing code when unclear                                                                                                                                                                                                                                    |
| 3   | **No `cat`/shell redirection to write files** — use IDE file-edit tools only (tracked diffs, rollback)                                                                                                                                                                                          |
| 4   | **No new REST routes** — GraphQL only; BetterAuth is the only REST endpoint                                                                                                                                                                                                                     |
| 5   | **No `router.refresh()`** — optimistic updates + `invalidateQueries` keep UI in sync                                                                                                                                                                                                            |
| 6   | **Always inline form errors** — `error?` prop on wrappers, `iErrCls` on inputs, `onInvalid` handler                                                                                                                                                                                             |
| 7   | **Never spread DTOs into RHF `defaultValues`** — map fields explicitly                                                                                                                                                                                                                          |
| 8   | **Prefer file tools over CLI** — CLI can silently return empty output; use `read_file`, `grep_search`, etc.                                                                                                                                                                                     |
| 9   | **Image uploads are server-side** — client sends base64 to `uploadImage` mutation; Cloudinary SDK runs on the server; no credentials reach the browser                                                                                                                                          |
| 10  | **Always use the `env` object** — `import { env } from '@/lib/settings/env'` for every env var access; never use `process.env.*` directly in application code                                                                                                                                   |
| 11  | **Use the logger everywhere** — server: `createLogger('module')` from `@/lib/logger`; client: `clientLogger('module')` from `@/lib/logger/client-logger`. Never use `console.*` in server or client code. Client `warn/error/fatal` forward to the server via `forwardClientLog` Server Action. |
| 12  | **Never write direct DB queries in non-repository files** — all database operations must go through exported repository functions.                                                                                                                                                              |

---

## File Naming Convention

Domain files use a **`<name>.<type>.ts`** double-extension so files are instantly identifiable and
filterable in IDE search/grep:

| Domain type          | Suffix           | Examples                                             |
| -------------------- | ---------------- | ---------------------------------------------------- |
| DB table definitions | `.table.ts`      | `auth.table.ts`, `subscription-management.table.ts`  |
| DB repositories      | `.repository.ts` | `services.repository.ts`, `payments.repository.ts`   |
| GraphQL resolvers    | `.resolvers.ts`  | `services.resolvers.ts`, `analytics.resolvers.ts`    |
| GraphQL SDL slices   | `.schema.ts`     | `services.schema.ts`, `mutation.schema.ts`           |
| GraphQL operations   | `.operations.ts` | `services.operations.ts`, `analytics.operations.ts`  |
| React Query hooks    | `.queries.ts`    | `use-services.queries.ts`, `use-payments.queries.ts` |

Index/entry barrel files (`schema.ts`, `operations.ts`, `resolvers.ts`) keep their plain names — they
aggregate domain files and must not contain logic.

---

## Where Things Live

```
CLAUDE.md                    ← Full authoritative instructions
AGENTS.md                    ← This file — universal agent entry point

src/
  proxy.ts                   ← Middleware logic (session check, redirects)
  app/(website)/             ← Public pages (landing, contact form)
  app/(dashboard)/console/   ← Admin console (auth-gated via middleware)
  app/s/[token]/             ← Public shared summary (read-only accountant view)
  app/api/graphql/           ← GraphQL endpoint (yoga — GET + POST)
  app/api/auth/              ← BetterAuth — DO NOT TOUCH
  components/
    ui/                      ← shadcn/ui primitives — DO NOT edit
    shared/                  ← Providers, theme, skeletons
    console/
      cms/                   ← Page-specific editors (accounts, clients, payments, …)
      timeline/              ← Gantt/Grid/Calendar view components
    website/                 ← Public page components
  lib/
    auth/
      auth.ts                ← BetterAuth config (GitHub OAuth + password)
      auth-client.ts         ← BetterAuth browser client
      helpers.ts             ← isAdmin(), isAccountant()
    config/
      routes.ts              ← Centralised ROUTES + ROUTE_PREFIXES constants
    db/
      index.ts               ← Drizzle client (postgres driver + SSL)
      schema.ts              ← Barrel re-export
      tables/
        auth.table.ts
        subscription-management.table.ts   ← ALL domain tables in one file
      repositories/          ← DB access layer (*.repository.ts)
        accounts/            ← streaming-accounts, streaming-profiles, profile-assignments
        settings/            ← app-settings, smtp, cloudinary, summary-links, inquiries, notifications
    graphql/
      schema.ts              ← Merges all SDL slices
      resolvers.ts           ← 1-line re-export shim
      context.ts             ← Per-request auth context
      client.ts              ← gqlRequest() — graphql-request wrapper
      operations.ts          ← Barrel re-export
      schema/                ← SDL slices per domain (*.schema.ts)
        accounts/
        settings/
      resolvers/             ← Resolver slices per domain (*.resolvers.ts)
        accounts/
        settings/
      operations/            ← Typed GQL operations per domain (*.operations.ts)
        accounts/
        settings/
    hooks/queries/           ← React Query hooks (*.queries.ts) — one file per domain
    settings/
      env.ts                 ← @t3-oss/env-nextjs validation
      config.ts              ← App config (name, default currency)
    logger/
      logger.ts              ← Pino (server) — createLogger('module')
      client-logger.ts       ← Client logger — clientLogger('module')
      client-log.action.ts   ← Server Action — forwards client warn/error/fatal
    utils/
      helpers.ts             ← cn(), formatCurrency(), slugify()
      date-utils.ts          ← addMonths(), computeEndDate(), isOverdue()
      mailer.ts              ← SMTP mail helper + NOTIFICATION_LABELS map
  middleware.ts              ← Imports proxy() from src/proxy.ts
  drizzle.config.ts
```

---

## Agent Capability Matrix

Different AI agents have different tool sets. Adapt accordingly:

| Capability             | Claude (Anthropic) | Copilot (GitHub) | Cursor | Windsurf |
| ---------------------- | ------------------ | ---------------- | ------ | -------- |
| File read/write tools  | ✅ Native          | ✅ Native        | ✅     | ✅       |
| Terminal execution     | ✅ (use sparingly) | ✅               | ✅     | ✅       |
| Multi-file edits       | ✅                 | ✅               | ✅     | ✅       |
| Semantic search        | ✅                 | ✅               | ✅     | ✅       |
| Rollback/diff tracking | ✅ (tool-based)    | ✅ (IDE-based)   | ✅     | ✅       |

**Key rule for all agents:** never use shell commands to write file content — always use the native file-edit tool
of the agent/IDE. Shell writes (`cat > file`, `echo >> file`, `tee`, heredocs) are not tracked in the diff and
cannot be rolled back.

---

## Resolvers Structure

Resolvers are split by domain under `src/lib/graphql/resolvers/`:

| File / Directory                            | Domain                                               |
| ------------------------------------------- | ---------------------------------------------------- |
| `index.ts`                                  | Merges all slices — the only file `route.ts` imports |
| `guards.ts`                                 | `requireAdmin(ctx)` / `requireAuth(ctx)`             |
| `analytics.resolvers.ts`                    | Revenue + payment analytics queries                  |
| `clients.resolvers.ts`                      | Client CRUD                                          |
| `payments.resolvers.ts`                     | Payment tracking, mark-as-paid, overdue              |
| `plans.resolvers.ts`                        | Plan management (per service or promotion)           |
| `promotions.resolvers.ts`                   | Promotion/bundle CRUD                                |
| `services.resolvers.ts`                     | Service CRUD                                         |
| `subscriptions.resolvers.ts`                | Subscription create, renew, cancel                   |
| `accounts/streaming-accounts.resolvers.ts`  | Streaming account CRUD                               |
| `accounts/streaming-profiles.resolvers.ts`  | Profile CRUD within an account                       |
| `accounts/profile-assignments.resolvers.ts` | Link subscriptions ↔ streaming profiles              |
| `settings/app-settings.resolvers.ts`        | Default currency + key-value settings                |
| `settings/cloudinary-settings.resolvers.ts` | Cloudinary config + `uploadImage` mutation           |
| `settings/smtp-settings.resolvers.ts`       | SMTP config + `sendTestEmail` mutation               |
| `settings/inquiries.resolvers.ts`           | Contact inquiry read/reply                           |
| `settings/notifications.resolvers.ts`       | Notification event toggle                            |
| `settings/summary-links.resolvers.ts`       | Summary link CRUD                                    |

`src/lib/graphql/resolvers.ts` is a 1-line re-export shim — do not add logic to it.

---

## Image Uploads (Cloudinary)

- **Server-side only** — client reads file via `FileReader`, sends base64 to `uploadImage` GraphQL mutation.
- The server calls the Cloudinary SDK with DB-stored credentials — nothing reaches the browser.
- Media library component: `src/components/console/cms/media-library.tsx`
- Cloudinary settings editor: `src/components/console/cms/cloudinary-editor.tsx`
- Resolver: `src/lib/graphql/resolvers/settings/cloudinary-settings.resolvers.ts`

---

## Domain Model

All domain tables live in `src/lib/db/tables/subscription-management.table.ts`.

| Table                         | Key fields / notes                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| `users`                       | BetterAuth table + `role` enum (`admin`/`accountant`/`user`)                              |
| `services_services`           | name, category, description, logoUrl, isActive                                            |
| `services_plans`              | name, durationMonths, price, currencyCode, planType; `serviceId` XOR `promotionId`        |
| `promotions_promotions`       | name, description, isActive (bundle of services)                                          |
| `promotion_services`          | promotionId FK, serviceId FK (junction)                                                   |
| `subscriptions_clients`       | name, email, phone, notes, isActive                                                       |
| `subscriptions_subscriptions` | clientId, planId, startDate, endDate, isRecurring, status, renewedFromId                  |
| `subscriptions_payments`      | subscriptionId, dueDate, paidDate, amount, currencyCode, status                           |
| `streaming_accounts`          | Real account owned by reseller; serviceId, label, supportsProfiles, maxProfiles           |
| `streaming_profiles`          | Named profile inside a streaming account; `pinEncrypted` (AES-256-GCM as `iv:tag:cipher`) |
| `subscription_profiles`       | Junction: links a subscription → streaming account + optional profile                     |
| `settings_app_settings`       | Key-value store (defaultCurrency, etc.)                                                   |
| `settings_smtp`               | Single-row SMTP config (password AES-256-GCM encrypted)                                   |
| `settings_cloudinary`         | Single-row Cloudinary config (apiSecret AES-256-GCM encrypted)                            |
| `summary_links`               | Shareable read-only tokens for accountant view                                            |
| `contact_inquiries`           | Public contact form submissions                                                           |
| `contact_inquiry_replies`     | Admin replies to inquiries (sent via SMTP + stored for audit)                             |
| `notification_settings`       | Per-event toggle (`event` PK, `enabled` bool)                                             |
| `notification_events`         | Append-only audit log of every notification email attempted                               |

### Key business rules

- A plan belongs to **either** `serviceId` OR `promotionId` — never both
- `subscription.endDate = startDate + plan.durationMonths` (computed on create)
- `payment.status = 'overdue'` when `dueDate < today AND status = 'unpaid'`
- On renewal: create a new subscription (`renewedFromId = old id`) + new payment
- `isRecurring = true` → UI suggests renewal on expiry (not auto-charged)
- Profile PINs are AES-256-GCM encrypted; stored as `iv:authTag:ciphertext` hex

---

## User Roles & Authentication

| Role         | Access                                                  |
| ------------ | ------------------------------------------------------- |
| `admin`      | Full CRUD on all entities, all console routes           |
| `accountant` | Read-only: dashboard stats, analytics, shared summary   |
| `user`       | Default after signup — no console access until promoted |

- Middleware: `src/middleware.ts` → `proxy()` in `src/proxy.ts` checks session cookie for `/console/*`
- Role enforcement is **server-side** in GraphQL resolvers via `ctx.isAdmin` / `ctx.isAccountant`
- Use `requireAdmin(ctx)` / `requireAuth(ctx)` from `src/lib/graphql/resolvers/guards.ts`

---

## Currency Handling

- Default currency: `MAD` (stored in `settings_app_settings` as key `defaultCurrency`)
- Every price column stores an adjacent `currencyCode TEXT NOT NULL DEFAULT 'MAD'`
- Changing default currency affects **new** prices only — existing records keep their stored currency
- Use `formatCurrency(amount, currencyCode)` from `@/lib/utils/helpers` for all display

---

## Console Pages Map

| Path                              | Description                                      |
| --------------------------------- | ------------------------------------------------ |
| `/console`                        | Dashboard overview (stats cards)                 |
| `/console/services`               | Service CRUD                                     |
| `/console/promotions`             | Promotion/bundle CRUD                            |
| `/console/clients`                | Client CRUD                                      |
| `/console/subscriptions`          | Subscription management + renewal                |
| `/console/payments`               | Payment tracking, mark as paid                   |
| `/console/accounts`               | Streaming accounts + profiles management         |
| `/console/timeline`               | Gantt / Table Grid / Calendar timeline views     |
| `/console/analytics`              | Revenue charts, payment breakdown, service stats |
| `/console/summary`                | Summary link manager (generate shareable links)  |
| `/console/inquiries`              | Contact form messages + admin reply thread       |
| `/console/media`                  | Cloudinary media library                         |
| `/console/settings`               | App settings (default currency)                  |
| `/console/settings/smtp`          | SMTP config + send test email                    |
| `/console/settings/cloudinary`    | Cloudinary config + upload/delete test           |
| `/console/settings/notifications` | Per-event notification toggle                    |
| `/s/[token]`                      | Public shared summary (accountant read-only)     |
| `/auth/login`                     | Login (email + GitHub OAuth)                     |
| `/auth/signup`                    | Sign up                                          |
| `/`                               | Public offers/promotions landing page            |
| `/contact`                        | Public contact form                              |

---

## Adding a New Domain Section (checklist)

Follow this order — each step depends on the previous:

- [ ] 1. Add table(s) to `src/lib/db/tables/subscription-management.table.ts` + generate migration (`npm run db:generate && npm run db:migrate`)
- [ ] 2. Create repository in `src/lib/db/repositories/<domain>.repository.ts` (or `repositories/<domain>/index.ts` for sub-domains)
- [ ] 3. Add GraphQL SDL in `src/lib/graphql/schema/<domain>.schema.ts`
- [ ] 4. Add resolver (auth-guarded) in `src/lib/graphql/resolvers/<domain>.resolvers.ts`
- [ ] 5. Add typed operations in `src/lib/graphql/operations/<domain>.operations.ts` (re-exported by `operations.ts`)
- [ ] 6. Create React Query hook `src/lib/hooks/queries/use-<domain>.queries.ts`
- [ ] 7. Create editor component `src/components/console/cms/<domain>-editor.tsx`
- [ ] 8. Create console page `src/app/(dashboard)/console/<domain>/page.tsx`
- [ ] 9. Add route constant to `src/lib/config/routes.ts`
- [ ] 10. Add sidebar entry in `src/components/console/console-sidebar.tsx`

---

## Common Pitfalls (learn from past mistakes)

| Pitfall                                       | What goes wrong                                                                                        | Fix                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Spreading GQL object into RHF `defaultValues` | Extra keys fail `zodResolver` silently                                                                 | Map fields explicitly in a `toForm()` helper                                                                                           |
| `isDirty` guard on Save button                | Inputs inside `{isEditing && ...}` unmount → fields unregister → `isDirty` = false                     | Remove `!isDirty` from Save `disabled`; keep it only on Reset                                                                          |
| `router.refresh()` after mutation             | Full SSR round-trip, loading flash                                                                     | Use `invalidateQueries` in `onSettled`                                                                                                 |
| Direct DB call from Client Component          | Runtime error in browser                                                                               | Move to a repository → resolver → hook                                                                                                 |
| Direct DB query in a server page              | Bypasses repository layer, violates rule #12                                                           | Always use exported repository functions, even in server pages                                                                         |
| `cat > file << EOF` to write files            | Not tracked, no rollback                                                                               | Use `insert_edit_into_file` / `replace_string_in_file`                                                                                 |
| Raw `fetch('/api/graphql')`                   | No types, no optimistic update                                                                         | Use typed hook from `src/lib/hooks/queries/`                                                                                           |
| Creating REST `route.ts`                      | Violates GraphQL-only rule                                                                             | Add a GraphQL query/mutation instead                                                                                                   |
| Top-level DB import in a shared module        | `pg`/`postgres` driver (`net`/`tls`) pulled into browser bundle → `Module not found: 'net'`            | Use `dynamic import()` **inside the async function body** — never top-level-import a DB repo from a file that client code also imports |
| `process.env.*` direct access                 | Bypasses `@t3-oss/env-nextjs` validation, loses TypeScript types, ignores client/server boundary guard | Always use `import { env } from '@/lib/settings/env'` — add new vars to both `server`/`client` schema **and** `runtimeEnv`             |
| `console.*` in server or client code          | Bypasses log level, output routing, structured context, redaction, and server forwarding               | Server: `createLogger('module')` from `@/lib/logger` · Client: `clientLogger('module')` from `@/lib/logger/client-logger`              |
| Hardcoding route strings                      | Breaks on rename, impossible to refactor                                                               | Import from `ROUTES` in `src/lib/config/routes.ts`                                                                                     |

---

## Coding Style Rules

- Prefer named functions over arrow functions, especially for components. Arrow functions are only acceptable in special
  component cases (e.g., inline callbacks, hooks, or when required for lexical `this`).
- For default exports, use the `export default function` syntax directly on the function declaration, not as a separate
  statement.

## Additional Coding Rules

- If a component is too long, refactor it into smaller components to make it easier to read (!!! only if necessary).
- Avoid nested ternary expressions. If a ternary would be nested, extract the condition or result to a variable or
  function instead.
