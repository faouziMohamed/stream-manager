# StreamManager

A single Next.js 16 application. The UI, the GraphQL API, the business logic and
the database layer all live in one project and run in one process.

```
src/
  app/                  App Router — pages, /api/graphql, /api/cron/[job], Auth.js
  components/           Shared UI
  features/<domain>/    server/ (loaders, actions, .graphql) · shared/ · ui/
  lib/                  auth, graphql client, logger, settings/env, config
  server/               The former API, now in-process
    features/<domain>/  resolvers · use-cases · repositories · schemas
    lib/db/             Drizzle client + tables
    lib/graphql/        schema + resolver aggregation, Yoga instance, context
    workers/            Scheduled jobs, invoked by /api/cron/<job>
drizzle/                Migrations
```

## Request flow

```
Browser
  → React Server Component or React Query hook
  → Server Action / RSC loader
  → gqlRequest  (runs the Yoga pipeline in-process — no network hop)
  → Resolver → UseCase → Repository → PostgreSQL (Drizzle)
```

`/api/graphql` is a real route handler for external clients and GraphiQL.
Server-side callers skip the socket: an RSC making an HTTP request to its own
server can stall during build and prerender.

## Auth

Auth.js owns the browser session. The Credentials and GitHub providers call the
login use-cases directly; the resulting `auth_sessions` row id is stored in the
JWT. Every GraphQL request re-checks that row, so revoking a session logs the
user out on their next request even though their cookie is still valid. There
are no access/refresh tokens.

`src/lib/auth/auth.config.ts` holds the edge-safe half of the config used by
`src/proxy.ts` (middleware); `src/lib/auth/auth.ts` adds the database-backed
providers and runs only in the Node.js runtime.

## Quick start

```bash
pnpm install
cp .env.example .env     # then fill in the real values
pnpm db:migrate
pnpm seed:auth-user
pnpm dev
```

## Commands

| Command                                         | What it does                                                  |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `pnpm dev`                                      | Next dev server (webpack); `pnpm dev:turbo` for Turbopack     |
| `pnpm build` / `pnpm start`                     | Production build and serve                                    |
| `pnpm test`                                     | Vitest — app and server layer                                 |
| `pnpm test:e2e`                                 | Playwright                                                    |
| `pnpm lint` / `pnpm check:types`                | ESLint / tsc                                                  |
| `pnpm codegen`                                  | Dump SDL to `schema.graphql`, then regenerate typed documents |
| `pnpm db:generate` / `db:migrate` / `db:studio` | Drizzle Kit                                                   |
| `pnpm seed:auth-user`                           | Create the initial admin user                                 |

`make help` lists the same targets.

## Scheduled jobs

The former `node-cron` worker process is gone. Each job is a route handler at
`/api/cron/<job>`, guarded by a `Bearer $CRON_SECRET` header; the schedule lives
in `vercel.json`. Any external scheduler that can send that header works too.

## Conventions

- Import types with `import type { Foo }`, not `import { type Foo }`.
- Use `@/lib/settings/env` instead of `process.env`, and `ROUTES` from
  `@/lib/config/routes` instead of hardcoded paths.
- After editing a `.graphql` file under `src/features/*/.../graphql/`, run
  `pnpm codegen`.
