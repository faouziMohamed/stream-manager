# AGENTS.md — Universal AI Agent Instructions for dev.mfaouzi.com

> This file is the universal entry point for **any** AI agent (Claude, Copilot, Cursor, Windsurf, Gemini, GPT,
> etc.). The authoritative and complete set of rules lives in **`CLAUDE.md`** — always read that file first.
> This file provides orientation and cross-agent conventions.

---

## What is this project?

Personal portfolio + CMS for **Faouzi Mohamed** (`@faouziMohamed`).

| Layer     | Technology                                       |
| --------- | ------------------------------------------------ |
| Framework | Next.js 16 — App Router                          |
| Language  | TypeScript (strict)                              |
| Styling   | Tailwind CSS v4 + shadcn/ui                      |
| Forms     | react-hook-form + zod v4                         |
| Data      | TanStack React Query v5 + GraphQL (yoga/request) |
| Database  | MySQL (Aiven) via Drizzle ORM                    |
| Auth      | BetterAuth (`/api/auth/[...all]`) — read-only    |
| Node      | ≥ 24.0.0                                         |

---

## Quick-Start for Agents

1. **Read `CLAUDE.md`** — it contains the full directory structure, conventions, workflow rules, and agent skills.
2. **Understand the client/server boundary:**
   - Server Components → call DB repositories directly (no HTTP)
   - Client Components → call React Query hooks backed by GraphQL only
3. **All data mutations go through GraphQL** — no new REST routes, no raw `fetch()` from client code.
4. **Never modify** `src/components/ui/` or `src/app/api/auth/` without explicit user approval.

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

| Domain type          | Suffix           | Examples                                               |
| -------------------- | ---------------- | ------------------------------------------------------ |
| DB table definitions | `.table.ts`      | `projects.table.ts`, `guestbook.table.ts`              |
| DB repositories      | `.repository.ts` | `cms-projects.repository.ts`, `comments.repository.ts` |
| GraphQL resolvers    | `.resolvers.ts`  | `portfolio.resolvers.ts`, `settings.resolvers.ts`      |
| GraphQL SDL slices   | `.schema.ts`     | `portfolio.schema.ts`, `query.schema.ts`               |
| GraphQL operations   | `.operations.ts` | `projects.operations.ts`, `comments.operations.ts`     |
| React Query hooks    | `.queries.ts`    | `use-projects.queries.ts`, `use-comments.queries.ts`   |

Index/entry barrel files (`schema.ts`, `operations.ts`, `resolvers.ts`) keep their plain names — they
aggregate domain files and must not contain logic.

---

## Where Things Live

```
CLAUDE.md                    ← Full authoritative instructions
AGENTS.md                    ← This file — universal agent entry point
.github/copilot-instructions.md  ← GitHub Copilot condensed reference

src/
  app/(website)/             ← Public portfolio pages
  app/(dashboard)/console/   ← CMS console (auth-gated)
  app/api/graphql/           ← GraphQL endpoint (yoga)
  app/api/auth/              ← BetterAuth — DO NOT TOUCH
  components/
    ui/                      ← shadcn/ui primitives — DO NOT edit
    shared/                  ← Shared across pages (providers, theme, skeleton, links)
    portfolio/               ← Home page sections, sidebar, nav, footer
    guestbook/               ← /guestbook page components
    console/
      cms/                   ← CMS editor + stats components
  lib/graphql/schema/        ← SDL slices (*.schema.ts)
  lib/graphql/resolvers/     ← Resolver slices (*.resolvers.ts)
  lib/graphql/operations/    ← GQL fragments + types (*.operations.ts) — barrel: operations.ts
  lib/hooks/queries/         ← React Query hooks (*.queries.ts)
  lib/db/tables/             ← Drizzle table definitions (*.table.ts) — barrel: schema.ts
  lib/db/repositories/       ← DB access layer (*.repository.ts)
  lib/settings/env.ts        ← Env var validation
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

| File                         | Domain                                                   |
| ---------------------------- | -------------------------------------------------------- |
| `index.ts`                   | Merges all slices — the only file `route.ts` imports     |
| `availability.resolvers.ts`  | Availability query + mutation                            |
| `feature-flags.resolvers.ts` | Feature flag queries + mutations                         |
| `portfolio.resolvers.ts`     | Focus areas, experiences, projects, skills, testimonials |
| `guestbook.resolvers.ts`     | Comments, replies, votes, stats                          |
| `settings.resolvers.ts`      | SMTP/media settings + `uploadImage` (Cloudinary SDK)     |
| `site-settings.resolvers.ts` | Author/site profile CRUD (admin only)                    |
| `contact.resolvers.ts`       | `sendContactMessage`                                     |
| `users.resolvers.ts`         | User management (admin only)                             |

`src/lib/graphql/resolvers.ts` is a 1-line re-export shim — do not add logic to it.

---

## Image Uploads (Cloudinary)

- **Server-side only** — client reads file via `FileReader`, sends base64 to `uploadImage` GraphQL mutation.
- The server calls the Cloudinary SDK with DB-stored credentials — nothing reaches the browser.
- Component: `src/components/console/image-uploader.tsx` → `useUploadImage()` hook.
- Resolver: `src/lib/graphql/resolvers/settings.resolvers.ts`.

---

---

## First-Launch Setup (`/console/setup`)

- Triggered automatically when **no admin row** exists in `user` table.
- Any `/console/*` visit → `console/layout.tsx` → `hasAdminUser()` → redirects to `/console/setup`.
- Lives in `src/app/(setup)/console/setup/` — **separate route group**, no console layout (avoids redirect loop).
- Three-step wizard:
  1. **Token gate** — dev pastes the setup token. Verified server-side via `verifySetupToken` Server Action. Sets a
     short-lived HMAC-signed HttpOnly cookie `setup_token_ok` that survives the OAuth redirect.
  2. **Social sign-in** — GitHub or Google, `callbackURL: /console/setup`.
  3. **Promote** — `promoteToAdmin()` Server Action re-validates cookie → sets `role='admin'` in DB → cookie +
     `.setup-token` file deleted.
- **Token resolution order** (`src/lib/auth/setup-token.ts`):
  1. `CONSOLE_SETUP_TOKEN` env var — highest priority, works on all platforms including Vercel
  2. `.setup-token` file at project root — persisted from a previous dev-server run
  3. **Auto-generate** → attempt to write `.setup-token` (mode 600); if filesystem is read-only (Vercel, Fly.io, etc.)
     store in **module-level memory cache** instead → print coloured banner to server console either way
- **Read-only filesystem behaviour (Vercel etc.):**
  - Token is memory-only — lost on every cold start / serverless function restart
  - Banner in server logs warns: `⚠ Read-only FS — token is memory-only (lost on restart)`
  - Wizard UI shows a warning telling the dev to complete setup in one session or set `CONSOLE_SETUP_TOKEN`
  - **Recommended for production:** set `CONSOLE_SETUP_TOKEN` in the platform's environment variables UI before first
    deploy
- `.setup-token` is gitignored; `clearSetupToken()` deletes it and clears the memory cache after promotion.
- **`ADMIN_EMAIL` is removed** — any social account can become admin as long as they have the token.
- Server Actions: `src/lib/actions/setup.actions.ts` · Token manager: `src/lib/auth/setup-token.ts` · Wizard UI:
  `src/components/console/setup-wizard.tsx`

---

## Studio CMS Pages Map

| Group      | URL                                | Description                         |
| ---------- | ---------------------------------- | ----------------------------------- |
| Overview   | `/console`                         | Live stats dashboard + shortcuts    |
| Moderation | `/console/guestbook/moderation`    | Approve / delete / restore comments |
| Spotlight  | `/console/guestbook/spotlight`     | Pin comments to home page section   |
| Portfolio  | `/console/portfolio/availability`  | Availability status editor          |
| Portfolio  | `/console/portfolio/feature-flags` | Feature flag toggles (admin)        |
| Portfolio  | `/console/portfolio/focus-areas`   | Current focus areas editor          |
| Portfolio  | `/console/portfolio/experiences`   | Work experience editor              |
| Portfolio  | `/console/portfolio/projects`      | Projects editor                     |
| Portfolio  | `/console/portfolio/skills`        | Skills editor                       |
| Portfolio  | `/console/portfolio/testimonials`  | Testimonials editor                 |
| Settings   | `/console/settings/smtp`           | SMTP / mail server config (admin)   |
| Settings   | `/console/settings/media`          | Cloudinary media config (admin)     |
| Settings   | `/console/settings/site`           | Author profile + social links       |
| Users      | `/console/users`                   | User management (admin)             |

---

## Adding a New CMS Section (checklist)

Follow this order — each step depends on the previous:

- [ ] 1. Add Drizzle table(s) in `src/lib/db/tables/<domain>.table.ts` (re-exported by `schema.ts`) + generate migration
- [ ] 2. Create repository `src/lib/db/repositories/cms-<name>.repository.ts`
- [ ] 3. Add GraphQL SDL types + query/mutation in the relevant `src/lib/graphql/schema/<domain>.schema.ts` slice
- [ ] 4. Add resolver (auth-guarded) in the relevant `src/lib/graphql/resolvers/<domain>.resolvers.ts` slice
- [ ] 5. Add typed operations + TS types in `src/lib/graphql/operations/<domain>.operations.ts` (re-exported by
     `operations.ts`)
- [ ] 6. Create React Query hook `src/lib/hooks/queries/cms/use-<name>.queries.ts`
- [ ] 7. Create editor component `src/components/console/cms/<name>-editor.tsx`
- [ ] 8. Create stats component `src/components/console/cms/<name>-stats.tsx`
- [ ] 9. Create console page `src/app/(dashboard)/console/portfolio/<name>/page.tsx`
- [ ] 10. Add sidebar entry in `src/components/console/console-sidebar.tsx`

---

## Common Pitfalls (learn from past mistakes)

| Pitfall                                       | What goes wrong                                                                                        | Fix                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Spreading GQL object into RHF `defaultValues` | Extra `links` key fails `zodResolver` silently                                                         | Map fields explicitly in a `toForm()` helper                                                                                           |
| `isDirty` guard on Save button                | Inputs inside `{isEditing && ...}` unmount → fields unregister → `isDirty` = false                     | Remove `!isDirty` from Save `disabled`; keep it only on Reset                                                                          |
| `router.refresh()` after mutation             | Full SSR round-trip, loading flash                                                                     | Use `invalidateQueries` in `onSettled`                                                                                                 |
| Direct DB call from Client Component          | Runtime error in browser                                                                               | Move to a repository → resolver → hook                                                                                                 |
| Feature flags from env vars                   | Stale on deploy, not runtime-controllable                                                              | Read from `cms_feature_flags` via `getEffectiveFeatureFlags()`                                                                         |
| `cat > file << EOF` to write files            | Not tracked, no rollback                                                                               | Use `insert_edit_into_file` / `replace_string_in_file`                                                                                 |
| Raw `fetch('/api/graphql')`                   | No types, no optimistic update                                                                         | Use typed hook from `src/lib/hooks/queries/`                                                                                           |
| Creating REST `route.ts`                      | Violates GraphQL-only rule                                                                             | Add a GraphQL query/mutation instead                                                                                                   |
| Top-level DB import in a shared module        | `mysql2` (`net`/`tls`) pulled into browser bundle → `Module not found: 'net'`                          | Use `dynamic import()` **inside the async function body** — never top-level-import a DB repo from a file that client code also imports |
| `process.env.*` direct access                 | Bypasses `@t3-oss/env-nextjs` validation, loses TypeScript types, ignores client/server boundary guard | Always use `import { env } from '@/lib/settings/env'` — add new vars to both `server`/`client` schema **and** `runtimeEnv`             |
| `console.*` in server or client code          | Bypasses log level, output routing, structured context, redaction, and server forwarding               | Server: `createLogger('module')` from `@/lib/logger` · Client: `clientLogger('module')` from `@/lib/logger/client-logger`              |

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
