# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Work queue**: `QUEUE.md` — read the index before starting; add an entry as soon as work is agreed.
> **Design system**: `DESIGN.md` — tokens, type, shapes and the named UI rules.
> **Primary rulebook**: `AGENTS.md` — read it before every task. All non-negotiable rules live there.
> **Enforcement reminder**: `.aiassistant/rules/non-negociable-rules.md` — concise rule summary; if it conflicts with `AGENTS.md`, follow `AGENTS.md`.
> **Domain model**: `docs/rebuild/plans-shared.md` — canonical entity definitions and business rules.

---

## Commands

Everything runs from the repo root — this is a single Next.js app, not a monorepo.

```bash
pnpm install
pnpm dev              # next dev (webpack); pnpm dev:turbo for Turbopack
pnpm build            # next build
pnpm start            # serve the production build
pnpm lint             # eslint .
pnpm check:types      # tsc --noEmit
pnpm lint:check       # lint + check:types
pnpm format           # prettier --write .
pnpm test             # vitest run (app + server layer)
pnpm test:watch
pnpm test:e2e         # playwright
pnpm schema:print     # dump SDL to schema.graphql
pnpm codegen          # schema:print, then regenerate typed GQL documents
pnpm db:generate      # drizzle-kit generate (after a schema change)
pnpm db:migrate       # apply pending migrations
pnpm db:studio        # Drizzle Studio
pnpm seed:auth-user   # seed the initial admin user
```

Run a single test file:

```bash
pnpm vitest run src/server/features/customers/use-cases/create-customer.use-case.test.ts
```

`make help` lists equivalent Make targets.

---

## Architecture

### Request flow

```
Browser
  → Next.js App Router (RSC or client component)
  → React Query hook → Server Action, or an RSC loader
  → gqlRequest → Yoga pipeline, in-process
  → Resolver → UseCase → Repository → PostgreSQL (Drizzle ORM)
```

There is no second process and no network hop. `src/lib/graphql/client.ts` calls
`yoga.fetch` directly, because an RSC or Server Action issuing a real HTTP
request to its own server can stall during build and prerender.
`/api/graphql` remains a real route handler for external clients and GraphiQL.

### Server layer (`src/server/`)

The former Express API. Nothing here may be imported from a client component.

```
src/server/
  common/            errors, utils, constants, security
  config/            env re-export, logger, yoga config, graphql logging plugin
  features/<domain>/
    resolvers/       thin GraphQL dispatchers (.resolvers.ts)
    use-cases/       business logic (.use-case.ts)
    repositories/    Drizzle queries only (.repository.ts)
    schemas/
      graphql/       SDL slices (.schema.ts)
      validators/    Zod input validation (.validators.ts)
      model/         DTO types (.model.ts)
  lib/db/            Drizzle client (globalThis-cached pool) + tables
  lib/graphql/       schema.ts + resolvers.ts aggregation, yoga.ts, context.ts
  workers/           job bodies, invoked by /api/cron/<job>
```

### Frontend feature layout (`src/features/<domain>/`)

```
server/           ← RSC loaders, Server Actions, .graphql operation files
shared/           ← types, mappers, schemas shared across server/client
ui/
  components/     ← React components (.tsx)
  graphql/        ← .graphql operation files (codegen input)
  queries/        ← React Query hooks (.queries.ts)
```

Route groups under `src/app/`:

- `(auth)/` — Auth.js sign-in/out flows
- `(dashboard)/` — Admin console (role-gated)
- `(website)/` — Public marketing pages
- `api/graphql/` — Yoga route handler
- `api/cron/[job]/` — scheduled jobs, `Bearer $CRON_SECRET`
- `api/auth/[...nextauth]/` — Auth.js

### Key files

| Path                                | Purpose                                            |
| ----------------------------------- | -------------------------------------------------- |
| `src/lib/auth/auth.ts`              | Auth.js config (Node runtime; DB-backed providers) |
| `src/lib/auth/auth.config.ts`       | Edge-safe config half, used by `src/proxy.ts`      |
| `src/lib/auth/require-session.ts`   | `requireSession()` guard for Server Actions        |
| `src/lib/settings/env.ts`           | The `env` object — use instead of `process.env`    |
| `src/lib/config/routes.ts`          | `ROUTES` constants — never hardcode route strings  |
| `src/lib/graphql/client.ts`         | `gqlRequest` — in-process GraphQL execution        |
| `src/lib/graphql/generated/`        | codegen output (do not edit manually)              |
| `src/server/lib/graphql/yoga.ts`    | Shared Yoga instance and executable schema         |
| `src/server/lib/graphql/context.ts` | Builds `GqlContext` from the Auth.js session       |
| `src/proxy.ts`                      | Middleware; `/console/*` route guard               |

### Auth

Auth.js (`next-auth` v5) owns the browser session. The Credentials and GitHub
providers call `loginWithPasswordUseCase` / `loginWithOAuthUseCase` directly;
the `auth_sessions` row id they return is stored in the JWT as `sessionId`.
`createGraphQLContext()` re-checks that row on every request, so revoking a
session logs the user out on their next request. There are no access or refresh
tokens, and no token refresh coordinator.

### Scheduled jobs

Job bodies live in `src/server/workers/` and are registered in
`src/server/workers/registry.ts`. `/api/cron/<job>` runs one; the schedule lives
in `vercel.json`. Without `CRON_SECRET` set, the endpoints return 401.

### GraphQL codegen

After editing `.graphql` files under `src/features/*/.../graphql/`, run
`pnpm codegen`. It dumps the SDL from `src/server/lib/graphql/schema.ts` to
`schema.graphql`, then regenerates `src/lib/graphql/generated/`. No running
server is required.

---

## TypeScript path aliases

`@/` → `src/`. The server layer is `@/server/...`.

Use `import type { Foo }` (not `import { type Foo }`) for type-only imports.

## Git commit attribution

Never add an AI co-authorship trailer (e.g. `Co-Authored-By: Claude`,
`Co-Authored-By: Codex`, or any other AI/agent attribution) to git commits in
this repository.
