# GitHub Copilot Instructions — dev.mfaouzi.com

> Authoritative rules live in [`CLAUDE.md`](../CLAUDE.md). This file is a condensed reference — always defer to
> `CLAUDE.md` for the full context.

---

## Project

Personal portfolio site for **Faouzi Mohamed** — Next.js 16 (App Router), React 19, TypeScript (strict),
Tailwind CSS v4, shadcn/ui, Node ≥ 24.

---

## Workflow Rules (non-negotiable)

1. **Plan before coding** — describe your approach and wait for approval before writing any code.
2. **Clarify ambiguity** — ask questions before writing code when requirements are unclear.
3. **Post-code review** — after writing code, list edge cases and suggest test cases.
4. **Limit scope** — if a task touches more than 3 files, break it into smaller tasks first.
5. **Bug-fix workflow** — write a reproducing test first, then fix until the test passes.
6. **Never use `cat`/shell redirection to write files** — always use the IDE file-edit tools so changes are tracked
   and rollback is possible.
7. **Prefer file tools over CLI for reading** — `read_file`, `list_dir`, `file_search`, `grep_search` are
   reliable. Shell commands (`cat`, `grep`, `ls`) can silently return empty output. Use CLI only for tasks a file
   tool cannot do (e.g. `npm install`, migrations). If CLI returns empty output, fall back to file tools.
8. **No new REST routes** — every new server operation must be a GraphQL query or mutation. The only REST routes
   are BetterAuth. Do not create `route.ts` files outside `api/auth/`.
9. **Never call `router.refresh()` after mutations** — optimistic updates + `invalidateQueries` handle UI sync.
10. **Always use the `env` object** — `import { env } from '@/lib/settings/env'` for every env var access; never
    use `process.env.*` directly in application code.
11. **Use the logger everywhere** — server: `createLogger('module')` from `@/lib/logger`; client:
    `clientLogger('module')` from `@/lib/logger/client-logger`. Never use `console.*` in server or client
    code. Client `warn/error/fatal` are automatically forwarded to the server via Server Action.

---

## Additional Coding Rules

- If a component is too long, refactor it into smaller components to make it easier to read (!!! only if necessary).
- Avoid nested ternary expressions. If a ternary would be nested, extract the condition or result to a variable or
  function instead.

---

## Stack & Path Aliases

| Alias | Resolves to |
| ----- | ----------- |
| `@/*` | `src/*`     |
| `~/*` | `public/*`  |

- Styling: Tailwind v4 utilities + `cn()` from `@/lib/utils/helpers`
- Components: RSC by default; `'use client'` only when state/effects needed
- Types: strict TypeScript, `import type` for type-only imports, no `any`
- Data: static fallback in `src/lib/data/data.ts`; DB overrides at runtime via CMS
- Env vars: validated with `@t3-oss/env-nextjs` in `src/lib/settings/env.ts` — always add to both schema and
  `runtimeEnv`. **Always access via `env` object** — never `process.env.*` directly in application code.
- Feature flags: DB-driven only via `cms_feature_flags` table; `getEffectiveFeatureFlags()` reads from DB
- UI primitives: `src/components/ui/` (shadcn/ui) — avoid editing unless necessary
- Scripts: `npm run lint:check` (lint + types), `npm run format` (prettier)

---

## Data Transport

- **GraphQL only** for all client → server data operations (`POST /api/graphql`)
- **No new REST routes** — only BetterAuth at `/api/auth/[...all]` is REST
- Client: `graphql-request` via `src/lib/graphql/client.ts`
- Operations (typed): `src/lib/graphql/operations.ts`
- Hooks: `src/lib/hooks/queries/` — React Query wrapping GraphQL with optimistic updates
- Auth guard in resolvers: check `ctx.isModerator` / `ctx.isAdmin`; throw `GraphQLError(FORBIDDEN)` if denied

---

## File Naming Convention

Domain files use a **`<name>.<type>.ts`** double-extension so files are instantly identifiable and filterable:

| Domain type        | Suffix           | Examples                                               |
| ------------------ | ---------------- | ------------------------------------------------------ |
| DB repositories    | `.repository.ts` | `cms-projects.repository.ts`, `comments.repository.ts` |
| GraphQL resolvers  | `.resolvers.ts`  | `portfolio.resolvers.ts`, `settings.resolvers.ts`      |
| GraphQL SDL slices | `.schema.ts`     | `portfolio.schema.ts`, `query.schema.ts`               |
| React Query hooks  | `.queries.ts`    | `use-projects.queries.ts`, `use-comments.queries.ts`   |

Index/entry files (`index.ts`, `schema.ts`, `resolvers.ts`) keep their plain names.

---

## Components Structure

```
src/components/
  ui/          ← shadcn/ui primitives — DO NOT edit
  shared/      ← Shared across pages (providers, theme, skeleton, links)
  portfolio/   ← Home page sections, sidebar, nav, footer
  guestbook/   ← /guestbook page components
  console/
    cms/       ← CMS editor + stats components
```

---

## Resolvers Structure

Resolvers are split by domain under `src/lib/graphql/resolvers/`:

| File                         | Domain                                                   |
| ---------------------------- | -------------------------------------------------------- |
| `index.ts`                   | Merges all slices — the only file route.ts imports       |
| `availability.resolvers.ts`  | Availability query + mutation                            |
| `feature-flags.resolvers.ts` | Feature flag queries + mutations                         |
| `portfolio.resolvers.ts`     | Focus areas, experiences, projects, skills, testimonials |
| `guestbook.resolvers.ts`     | Comments, replies, votes, stats                          |
| `settings.resolvers.ts`      | SMTP/media settings + `uploadImage` (Cloudinary SDK)     |
| `contact.resolvers.ts`       | `sendContactMessage`                                     |
| `users.resolvers.ts`         | User management (admin only)                             |

`src/lib/graphql/resolvers.ts` is a 1-line re-export shim — do not add logic to it.

---

## Forms

- Always `react-hook-form` + `zod` + `zodResolver` — never `useState` for field state
- Always display errors inline: `error?: string` prop on field wrappers, `iErrCls` on inputs, message in
  `text-destructive`
- Always pass `onInvalid` to `handleSubmit(onSubmit, onInvalid)` — auto-open the first card with errors
- **Never spread DTO objects into `defaultValues`** — always map fields explicitly to avoid silent zodResolver
  failures

---

## React Query

- Every mutation: `onMutate` (optimistic) → `onError` (rollback) → `onSettled` (invalidate)
- Use `initialData` from server page — no loading state on first render
- Stats components and editors share the same query key — mutations update both instantly
- Never call `router.refresh()` after mutations

---

## Image Uploads (Cloudinary)

- **All uploads are server-side** — the client reads a file via `FileReader`, sends the base64 string to the
  `uploadImage` GraphQL mutation, and the server calls the Cloudinary SDK with DB-stored credentials.
- **No Cloudinary credentials ever reach the browser** — no API key, no secret, no signed URL.
- Component: `src/components/console/image-uploader.tsx` — uses `useUploadImage()` hook.
- Hook: `src/lib/hooks/queries/cms/use-media-settings.queries.ts` → `useUploadImage`.
- Resolver: `src/lib/graphql/resolvers/settings.resolvers.ts` → `uploadImage` mutation.

---

## Console Pages Pattern

1. **Server page** — fetches `initialData` from DB repo, passes as props
2. **Stats component** — `'use client'`, same React Query key as editor
3. **Editor component** — `'use client'`, `react-hook-form` + optimistic mutation

---

## Console Routes

| Group     | Path                               | Description                       |
| --------- | ---------------------------------- | --------------------------------- |
| Overview  | `/console`                         | Live stats + shortcuts            |
| Guestbook | `/console/guestbook/moderation`    | Comment moderation                |
| Guestbook | `/console/guestbook/spotlight`     | Home spotlight (pinned comments)  |
| Portfolio | `/console/portfolio/availability`  | Availability editor               |
| Portfolio | `/console/portfolio/feature-flags` | Feature flag toggles (admin)      |
| Portfolio | `/console/portfolio/focus-areas`   | Focus areas editor                |
| Portfolio | `/console/portfolio/experiences`   | Work experience editor            |
| Portfolio | `/console/portfolio/projects`      | Projects editor                   |
| Portfolio | `/console/portfolio/skills`        | Skills editor                     |
| Portfolio | `/console/portfolio/testimonials`  | Testimonials editor               |
| Settings  | `/console/settings/smtp`           | SMTP / mail server config (admin) |
| Settings  | `/console/settings/media`          | Cloudinary media config (admin)   |
| Users     | `/console/users`                   | User management (admin)           |
