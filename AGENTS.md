<!-- BEGIN:nextjs-agent-rules -->

# AGENTS.md — Universal AI Agent Instructions for stream.mfaouzi.com

> Authoritative instructions for **StreamManager** — a subscription management dashboard for streaming service resellers.
> Single source of truth. No separate CLAUDE.md.

---

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read
the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## What is this project?

Authoritative rules for **StreamManager** — a subscription management dashboard for streaming service resellers.

| Layer            | Technology                                                   |
| ---------------- | ------------------------------------------------------------ |
| App name         | StreamManager                                                |
| Framework        | Next.js 16 — App Router                                      |
| Language         | TypeScript (strict)                                          |
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

## Quick-Start for Agents

1. **Understand the client/server boundary:**
   - Server Components → call DB repositories directly (no HTTP)
   - Client Components → call React Query hooks backed by GraphQL only
1. **All data mutations go through GraphQL** — no new REST routes, no raw `fetch()` from client code.
1. **Never modify** `src/components/ui/` or `src/app/api/auth/` without explicit user approval.
1. **Use centralized routes** — import from `src/lib/config/routes.ts` (`ROUTES`, `ROUTE_PREFIXES`), never hardcode paths.

---

## Additional Workflow Rules

| #   | Rule                                                                                     |
| --- | ---------------------------------------------------------------------------------------- |
| 1   | **Post-code review** — after writing code, list edge cases and suggest test cases        |
| 2   | **Limit scope** — if a task touches more than 3 files, break it into smaller tasks first |
| 3   | **Bug-fix workflow** — write a reproducing test first, then fix until the test passes    |

## Data Transport

- **GraphQL only** for client → server data — no new REST routes
- Client: `gqlRequest()` from `@/lib/graphql/client.ts`

## React Query

- Every mutation: `onMutate` (optimistic) → `onError` (rollback) → `onSettled` (invalidate)
- Use `initialData` from server page — no loading state on first render

## Implementation Status

| Phase | Status      | Description                                                                             |
| ----- | ----------- | --------------------------------------------------------------------------------------- |
| 1     | ✅ Complete | Foundation: DB schema, BetterAuth, GraphQL server, middleware, auth pages, public pages |
| 2     | ✅ Complete | Repositories + full GraphQL resolvers + React Query hooks for all domains               |
| 3     | ✅ Complete | Management pages + Timeline + Analytics + Summary + Shared link — all in French         |
| 4     | ✅ Complete | Timeline (Gantt/Grid/Calendar) + Analytics (Recharts charts) views                      |
| 5     | ✅ Complete | Shared summary page (/s/[token]) + settings + polish + all TS errors resolved           |

---

## 🚨 Non-Negotiable Rules — All Tasks

> **These rules are mandatory for every agent, every task, and every session.**

> **⛔ You are absolutely prohibited from violating any rule stated in this file.**
> Rule violations are not permitted under any circumstance — not when a skill is active,
> not when a sub-agent is running, not when the user asks informally, and not when the
> implementation appears simpler without the rules. If following a rule creates a conflict,
> stop and ask the user for guidance. There are no exceptions.

| #   | Rule                                                      | ✅ Do                                                                   | ❌ Don't                                                         |
| --- | --------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | **Plan before coding**                                    | Describe your approach, wait for approval                               | Start coding immediately without confirming the plan             |
| 2   | **Clarify ambiguity**                                     | Ask questions when unclear                                              | Make assumptions and write code based on them                    |
| 3   | **No shell redirection to write files**                   | Use Write/Edit tools (tracked diffs, rollback)                          | `cat > file << EOF` or any shell redirect to create/modify files |
| 4   | **No new REST routes**                                    | Add a GraphQL query/mutation for new operations                         | Create `route.ts` outside `api/auth/` or `api/graphql/`          |
| 5   | **No `router.refresh()`**                                 | Optimistic updates + `invalidateQueries` keep UI in sync                | Call `router.refresh()` after mutations                          |
| 6   | **Always inline form errors**                             | `error?` prop on wrappers, `iErrCls` on inputs, `onInvalid` handler     | Show errors in a toast/alert or skip validation feedback         |
| 7   | **Never spread DTOs into RHF `defaultValues`**            | Map fields explicitly in a `toForm()` helper                            | `defaultValues: { ...apiDto }` (extra keys fail silently)        |
| 8   | **Prefer file tools over CLI**                            | Read, Write, Edit, Glob, Grep tools                                     | `cat`, `grep`, `sed`, `awk`, `find` from shell                   |
| 9   | **Image uploads are server-side**                         | Client sends base64 → `uploadImage` mutation → Cloudinary SDK on server | Send Cloudinary credentials to the browser                       |
| 10  | **Always use the `env` object**                           | `import { env } from '@/lib/settings/env'`                              | `process.env.*` directly in application code                     |
| 11  | **Use the logger everywhere**                             | Server: `createLogger('module')` · Client: `clientLogger('module')`     | `console.log()` / `console.error()` in any file                  |
| 12  | **Never write direct DB queries in non-repository files** | Call exported repository functions                                      | `db.select()` or raw SQL in resolvers, components, or pages      |
| 13  | **No git write ops without instruction**                  | `git log`, `git diff`, `git status` (always fine)                       | `git add`, `git commit`, `git push` without explicit request     |
| 14  | **No DB write ops without approval**                      | Describe what will change, ask in plain terms, wait for "yes"           | INSERT/UPDATE/DELETE/migrations without explicit approval        |
| 15  | **Skip heavy plan docs**                                  | Brief outlines (approach + file list) in code comments                  | Implementation code in `.md` plan files                          |
| 16  | **Announce skills before use**                            | Tell which skill and why before invoking                                | Invoke silently without warning                                  |
| 17  | **Ask approval for token-heavy skills**                   | Warn the user, offer granular opt-out                                   | Spawn sub-agents without asking                                  |

### Code examples

```ts
// ─── #3 — File tools ──────────────────────────────────────────────────────────
// ✅ Good — use file tools (Write, Edit, Read, Grep)
// ❌ Bad — shell redirects (untracked, no rollback)

// ─── #4 — GraphQL only ────────────────────────────────────────────────────────
// ❌ Bad — creating a REST route.ts
// export async function GET() { ... }     // src/app/api/foo/route.ts
// ✅ Good — add a GraphQL mutation
// type Mutation { doSomething(input: Foo!): Bar }
```

```tsx
// ─── #5 — No router.refresh() ─────────────────────────────────────────────────
// ❌ Bad
const mutation = useMutation({
  onSuccess: () => router.refresh(), // full SSR round-trip, loading flash
});
// ✅ Good
const mutation = useMutation({
  onMutate: async () => {
    /* optimistic update */
  },
  onError: (_, __, context) => {
    /* rollback */
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: ["key"] }),
});
```

```tsx
// ─── #6 — Inline form errors ──────────────────────────────────────────────────
// ✅ Good
<Input error={errors.name?.message} {...register("name")} />;
{
  errors.name && (
    <p className="text-xs text-destructive">{errors.name.message}</p>
  );
}
// ❌ Bad — toast or alert on validation failure
// toast.error("Veuillez remplir tous les champs");
```

```ts
// ─── #7 — Never spread DTOs ───────────────────────────────────────────────────
// ❌ Bad — extra keys fail silently
// const form = useForm({ defaultValues: { ...apiDto } });
// ✅ Good — explicit mapping
function toForm(dto?: ServiceDto): ServiceForm {
  return { name: dto?.name ?? "", category: dto?.category ?? "streaming" };
}
```

```tsx
// ─── #10 — Env object ─────────────────────────────────────────────────────────
// ❌ Bad
// const db = new Pool({ connectionString: process.env.DATABASE_URL });
// ✅ Good
import { env } from "@/lib/settings/env";
const db = new Pool({ connectionString: env.DATABASE_URL });
```

```ts
// ─── #11 — Logger everywhere ──────────────────────────────────────────────────
// ❌ Bad
// console.log("User created", user);
// ✅ Good (server)
// import { createLogger } from '@/lib/logger';
// const log = createLogger('users');
// log.info({ userId: user.id }, "User created");
// ✅ Good (client)
// import { clientLogger } from '@/lib/logger/client-logger';
// const log = clientLogger('users');
// log.info("User created");
```

```ts
// ─── #12 — Repository layer ───────────────────────────────────────────────────
// ❌ Bad — in a resolver or component
// const users = await db.select().from(usersTable);
// ✅ Good — call exported repository
// import { getUsers } from '@/lib/db/repositories/users.repository';
// const users = await getUsers();
```

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

```text
src/
  proxy.ts             Session/redirect middleware
  middleware.ts        Imports proxy()
  app/(website)/       Public pages (landing, contact)
  app/(dashboard)/     Console (auth-gated)
  app/s/[token]/       Read-only accountant summary
  app/api/graphql/     Yoga GraphQL endpoint
  app/api/auth/        BetterAuth — DO NOT TOUCH
  components/ui/       shadcn/ui primitives — DO NOT edit
  components/shared/   Providers, theme, skeletons
  components/console/  CMS editors, timeline views
  components/website/  Public components
  lib/auth/            BetterAuth config, client, helpers
  lib/config/          Routes, app config
  lib/db/              Drizzle client, tables (auth + subscription), repositories
  lib/graphql/         Schema, resolvers, operations, context, client
  lib/hooks/queries/   React Query hooks per domain
  lib/settings/        Env validation, app config
  lib/logger/          Pino (server) + client logger
  lib/utils/           Helpers, date utils, mailer
```

---

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

## TypeScript Rules

- **`import type` for type-only imports** — never `import { type Foo }`; use `import type { Foo }`
- **No `any`** — use `unknown` + narrowing or proper types
- **Max 300 lines per file** — split immediately when a `.ts`/`.tsx` file exceeds 300 lines.
  - Extract into: `*-types.ts`, `*-constants.ts`, `*-helpers.ts`, `*-utils.ts`, `*-sections.tsx`
  - Keep the original as a barrel with re-exports for backwards compatibility if needed
  - Exceptions (up to 400 lines): visual renderers (`*.renderer.tsx`), auto-generated shadcn/ui files
  - Split directly — do not use token-intensive skills; sub-agents are fine for parallel independent files

- **Always use `@` absolute imports** — never use relative paths (`./`, `../`) for files inside `src/`. The `@*` → `./src/*` alias is configured in `tsconfig.json`.

  | Situation      | ✅ Good                         | ❌ Bad                   |
  | -------------- | ------------------------------- | ------------------------ |
  | Same directory | `from '@features/auth/helpers'` | `from './helpers'`       |
  | Parent dir     | `from '@features/auth/types'`   | `from '../auth/types'`   |
  | Cross-module   | `from '@lib/utils'`             | `from '../../lib/utils'` |

  Exception: third-party packages (`react`, `next`, `zod`) and Node built-ins (`fs`, `path`) stay as-is.

- **Exports at top of file** — place exported functions, classes, types, and constants at the top; non-exported helpers go below. Exception: when hoisting is impossible due to initialization order.

  ```ts
  export function main() { return helper() }  // ✅ exported first

  function helper() { ... }                   // ✅ helper below
  ```

- **Named `function` declarations over arrow variables** — for any non-trivial function (more than a one-liner), prefer `function foo() {}` over `const foo = () => {}`.

- **For default exports**, use the `export default function` syntax directly on the function declaration, not as a separate statement.

- **Avoid nested ternary expressions.** If a ternary would be nested, extract the condition or result to a variable or function instead.

## React Rules — shadcn/ui

- **Never use native HTML interactive elements** — always use library components instead.

  | Element                                      | Use instead                                                   |
  | -------------------------------------------- | ------------------------------------------------------------- |
  | `<input>`, `<textarea>`                      | `Input`, `Textarea` from `src/components/ui/`                 |
  | `<select>`, `<option>`                       | `Select` / `SelectContent` / `SelectItem` from the UI library |
  | `<input type="date">`                        | `Calendar` + `Popover` (shadcn/ui + `react-day-picker`)       |
  | `<button>`                                   | `Button` from `src/components/ui/button.tsx`                  |
  | `<dialog>`, `window.alert`, `window.confirm` | `Dialog`, `AlertDialog`, `Sheet` from shadcn/ui               |
  | `<label>`                                    | `Label` from `src/components/ui/label.tsx`                    |

  **Icons:** use `lucide-react` or `react-icons` — never inline SVG or emoji for interactive icons.

  **Missing component:** scaffold from [@radix-ui](https://www.radix-ui.com/) primitives following the existing shadcn pattern, then import it.

  ```tsx
  // ✅ Good
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline"><CalendarIcon className="h-4 w-4" /> Pick date</Button>
    </PopoverTrigger>
    <PopoverContent><Calendar mode="single" /></PopoverContent>
  </Popover>

  // ❌ Bad
  <input type="date" onChange={...} />
  <select><option>...</option></select>
  <button onClick={...}>Click</button>
  if (window.confirm('Delete?')) { ... }
  ```

## Next.js Rules

- **Read the docs before writing any code** — Next.js has breaking changes that may differ from training data. Check `node_modules/next/dist/docs/` before starting. Heed deprecation notices.

- **Validate env vars with `@t3-oss/env-nextjs`** — all env vars must be validated in `src/lib/settings/env.ts`. Keep server-only vars separate from `NEXT_PUBLIC_*` client vars.

<!-- END:nextjs-agent-rules -->
