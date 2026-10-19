 <!-- BEGIN:monorepo-agent-rules -->

# AGENTS.md — Universal AI Agent Instructions for StreamManager

> This file is the universal entry point for **any** AI agent working on this repository (Claude, Copilot, Cursor,
> Windsurf, Gemini, GPT, etc.). **There is no separate CLAUDE.md** — this file is the single source of truth.
>
> **These rules are mandatory for every agent, every task, and every session.**
>
> **⛔ You are absolutely prohibited from violating any rule stated in this file.**
> Rule violations are not permitted under any circumstance — not when a skill is active, not when a sub-agent is
> running, not when the user asks informally, and not when implementation appears simpler without the rules. If a rule
> creates conflict, stop and ask the user for guidance. There are no exceptions.

> **Persistent enforcement reminder:** The root file `.agent-policy.json` is an authoritative machine-readable
> enforcement reminder for agents and tools. It does not replace this document. If there is any mismatch, `AGENTS.md`
> remains the source of truth.

---

## Project Overview

**StreamManager** — a subscription management dashboard for streaming service resellers.

This is a **single Next.js 16 application** at the repo root. The UI, the
GraphQL API, the business logic and the database layer all live in one project
and run in one process. The separate Express API package is gone; its code now
lives in `src/server/` and is called in-process.

| Area            | Role                                                   |
| --------------- | ------------------------------------------------------ |
| `src/app/`      | App Router pages, `/api/graphql`, `/api/cron`, Auth.js |
| `src/features/` | Per-domain loaders, Server Actions, UI                 |
| `src/server/`   | GraphQL resolvers, use-cases, repositories, DB         |

**Node required**: ≥ 24.0.0

---

## Tech Stack — Quick Reference

### Server layer (`src/server/`)

| Layer            | Technology                                         |
| ---------------- | -------------------------------------------------- |
| Runtime          | Node.js ≥ 24 (Next.js route handlers / RSC)        |
| Language         | TypeScript (strict)                                |
| Database         | PostgreSQL via Drizzle ORM (`postgres` driver)     |
| Logging          | Pino (structured JSON)                             |
| ORM              | Drizzle (migrations via `drizzle-kit`)             |
| Validation       | Zod v4 (input + output schemas)                    |
| Password hashing | Argon2id                                           |
| Encryption       | AES-256-GCM (Node.js `crypto`)                     |
| Session handling | Auth.js cookie + server-side `auth_sessions` check |

### App layer (`src/app/`, `src/features/`, `src/components/`)

| Layer          | Technology                                   |
| -------------- | -------------------------------------------- |
| Framework      | Next.js 16 — App Router (RSC-first)          |
| Language       | TypeScript (strict)                          |
| Styling        | Tailwind CSS v4 + shadcn/ui                  |
| Forms          | react-hook-form + zod v4                     |
| Data fetching  | TanStack React Query v5 + in-process GraphQL |
| Auth           | Auth.js v5 (OAuth2 providers + email)        |
| Logging        | Pino (server) + clientLogger (client)        |
| Charts         | Recharts                                     |
| React Compiler | Enabled (`babel-plugin-react-compiler`)      |

---

## Quick-Start for Agents

**Before starting any task:**

1. **Identify which layer** — the server layer (`src/server/`: resolvers, use-cases, repositories) or the app layer (`src/app/`, `src/features/`, `src/components/`)?
2. **Read the relevant implementation prompt** — Located in `docs/rebuild/`. These predate the single-app collapse; treat their layering guidance as current and their `apps/api` / `apps/frontend` paths as historical.
3. **Reference the shared domain model** — `docs/rebuild/plans-shared.md` (entity definitions, business rules, entity
   renames)

**Prompt file precedence:**

- `AGENTS.md` is the authoritative rulebook for all agent behavior in this repository.
- `docs/rebuild/prompt-api.md` and `docs/rebuild/prompt-frontend.md` are implementation guides and execution references.
- `docs/rebuild/plans-shared.md` is the shared domain source of truth for entities and business rules.
- If any prompt file conflicts with `AGENTS.md`, follow `AGENTS.md` and ask the user before proceeding.

**Critical layering rules:**

- **Server layer** → Data flows through repositories (3-layer: Resolver→UseCase→Repository), never raw SQL in a resolver
- **App layer** → RSC loaders and Server Actions are the only callers of `gqlRequest`; client components call Server Actions through React Query hooks
- **Entity names are critical** — use `Customer`, `Membership`, `StreamingAccount`, `StreamingProfile` (not the old
  names)
- **Never import `src/server/` from a client component** — it pulls postgres, argon2 and secrets into the browser bundle. Go through a Server Action or loader.
- **One package** — `pnpm install` at the repo root; `pnpm-workspace.yaml` only carries pnpm settings

---

## Repository Structure

```
stream.mfaouzi.com/           ← git root, single package
  .agents/                    ← Root-level skills
  .github/                    ← GitHub workflows, configs
  pnpm-workspace.yaml         ← pnpm settings only (no workspace members)
  vercel.json                 ← cron schedules for /api/cron/<job>
  drizzle/                    ← migrations
  codegen.ts                  ← reads schema.graphql (produced by pnpm schema:print)

  src/
    app/                      ← Next.js App Router
      api/graphql/            ← Yoga route handler
      api/cron/[job]/         ← scheduled jobs (Bearer $CRON_SECRET)
      api/auth/[...nextauth]/ ← Auth.js
      (auth)/                 ← sign-in/out pages
      (dashboard)/            ← Admin console pages
      (website)/              ← Public pages
    components/
      ui/                     ← shadcn/ui primitives
      shared/                 ← Layout, providers, theme
      console/                ← Management UI components
    features/<domain>/
      server/                 ← RSC loaders, Server Actions, .graphql files
      shared/                 ← types, mappers, schemas
      ui/                     ← components/, graphql/, queries/
    lib/
      auth/                   ← Auth.js config (node + edge halves), guards
      graphql/                ← gqlRequest + generated/ (codegen output)
      settings/env.ts         ← the only place process.env is read
      config/routes.ts        ← ROUTES constants
    server/                   ← the former API, in-process
      features/<domain>/
        resolvers/            ← GraphQL resolver handlers
        use-cases/            ← Business logic
        repositories/         ← Drizzle queries
        schemas/              ← graphql/ validators/ model/
      lib/db/                 ← Drizzle client (globalThis-cached) + tables
      lib/graphql/            ← schema.ts, resolvers.ts, yoga.ts, context.ts
      workers/                ← job bodies + registry.ts
    proxy.ts                  ← middleware; /console/* guard

  docs/rebuild/               ← Implementation guides (pre-collapse paths)
    plans-shared.md           ← Entity definitions, business rules (source of truth)
```

**Key principle:** One process, one deployment. Server code lives under
`src/server/` and is reached from RSC loaders and Server Actions via
`gqlRequest`, which runs the Yoga pipeline in-process. Client components never
import `src/server/`.

---

## Critical Entity Renames

The old app used generic names that created ambiguity. The new canonical names are:

| Old Name       | New Name           | Reason                                                           |
| -------------- | ------------------ | ---------------------------------------------------------------- |
| `Client`       | `Customer`         | OAuth2 `client` is a term in auth specs; avoid collision         |
| `Account`      | `StreamingAccount` | Auth systems have `account`; streaming is the specific domain    |
| `Profile`      | `StreamingProfile` | User profile ≠ streaming profile; explicit boundary needed       |
| `Subscription` | `Membership`       | GraphQL SDL uses `Subscription` for subscriptions (async events) |

**Always use the new names in all code, comments, and schema.**

---

# Queue

> Adapted from the kartapay-marketplace workspace rulebook, 2026-10-17, at the
> user's instruction. Rules below use its one-rule-per-heading format.

## `one-queue-at-the-root`

`QUEUE.md` at the repo root is the single queue for this project — the shared
memory between sessions and between agents. It is not optional bookkeeping: a
task the user parks and nobody writes down is a task that gets redone from
scratch, with the settled decisions lost.

## `write-the-entry-when-agreed`

Add the entry as soon as the work is agreed, not when it starts — even if you
begin immediately, so an interrupted session leaves a trace.

## `single-in-progress`

Exactly one entry is `in progress`. Everything else is `ready` or blocked,
listed in the order it was raised.

## `record-every-new-ask-immediately`

Every new request, clarification or correction that arrives while a task is in
progress is written to `QUEUE.md` before it is acted on: as a subtask of the
active entry when it belongs to the same piece of work, or as a new entry at
the bottom of the index when it does not. The queue is the agent's working
memory — a task held only in the conversation is a task that is lost when the
context is compacted.

Then continue the task that was already in progress. A new ask never silently
replaces, interrupts or merges into the active task; if it is urgent enough to
change what you are doing now, say so and ask first. "I will remember it" is
not a record.

## `cold-pickup-able`

Every entry must be resumable by a session that has read nothing else: why it
exists, which files it lands in, what is already settled (with an absolute
date), and what decision is still open. Each entry carries a one-sentence
`**Resume:**` line under its status and a `### Context to load` list naming the
exact paths that make up the working set. Entries stay independent — never
write "as described in entry 2"; repeat the fact instead.

## `checkboxes-not-prose`

Track progress with check marks, never prose: `- [x]` is done _and_ verified,
`- [ ]` is open. Tick a box only once the thing is actually verified — a box
ticked on intention is worse than no box.

## `record-findings-as-verified`

Write findings down as they are verified, not from memory at the end. A
`### Known, accepted, not a new defect` section is the place for warts
deliberately left alone, with the reason.

## `outline-only`

Approach and file list, never implementation code — in the queue, in plans, and
in chat previews.

## `ship-leaves-one-line`

When an entry ships, delete it and leave a dated line under `## Shipped`,
carrying anything a future reader would otherwise have to rediscover.

---

# Discipline

## `user-rules-win`

Instructions the user states in the session outrank this file and every other
instruction source. Surface the conflict in one sentence, apply the
instruction, and amend the contradicted document in the same change. Never
quote a rule back at the user as a reason not to do what they asked.

## `verify-before-asserting`

Check the config, run the grep, read the file. A value you checked beats a
value you remember. Say "unverified" rather than stating a fact you have not
checked.

## `stay-in-scope`

Do not restructure or fix unrelated code outside the task scope. Mention it
instead — or queue it.

## `leave-test-data-alone`

Test customers, accounts, plans and memberships stay in the database. The user
uses them for their own manual testing, so rows created while exercising a flow
are an asset, not residue — do not propose a cleanup task for them, and do not
delete them even when they are obviously fake.

Remove seeded or test rows only when the user asks for that specific deletion in
this session. `no-destructive-sql-without-proof` still applies on top.

## `explain-after-implementing`

Do not write docs, TODO lists or long explanations unless requested. Explain
after implementing, briefly, unless the user asks for more detail.

## `review-and-autofix-before-manual-fixes`

When a task is finished, review the change set, then run the repo's own autofix
tooling (`pnpm lint:fix`, `pnpm format`) **before** touching any remaining
diagnostic by hand. Fix manually only what autofix leaves behind, and re-run
after. Read the exit status, not the last line of output — a piped `| tail`
reports the exit code of `tail`, so a failing run can look like it passed.

---

# Code quality

## `no-useless-comments`

Do not comment what the code already says, and never write long comments.
Comment only what a reader cannot infer: a deliberate choice that looks wrong,
a vendor trap, an external contract that forces the shape. No TODO in code — a
deferred task belongs in `QUEUE.md`.

## `descriptive-identifiers`

Never name a state, step or variant with a terse code (`T1`, `S2`, `STEP_3`).
Use the semantic name a reader without the design document still understands.

## `follow-the-repo-structure`

Match the established structure, file suffixes and folder conventions; extend
an existing pattern rather than inventing a parallel one. Locate the convention
first, then stay within the documented size cap.

---

# UI

## `design-system-is-documented`

`DESIGN.md` at the repo root records the tokens, type roles, shapes and named
UI rules this console actually ships. Read it before changing anything visual,
and update it in the same change when a token or rule moves.

## `use-accessible-ui-primitives`

Never use native interactive HTML or browser dialogs in feature code — use the
wrappers in `src/components/ui/`. Native elements belong only inside those
primitive implementations. A native `<input type="date">` renders different
unstyleable chrome on every platform; use `DatePicker`.

## `reuse-before-building-ui`

Before writing a form control, dialog, badge or empty state, check
`src/components/ui/` and `src/components/console/shared/` and use what is
there. "Reusable" is the test, not "is it a form field". Extend the existing
primitive when it is close but not sufficient, and use the extension
everywhere afterwards.

## `form-fields-have-leading-icons`

Every form control carries a leading icon — pass `icon` to `Input` and
`SelectTrigger`. A dense form is scanned, not read, and a form of bare boxes is
the clearest sign a screen was not designed. Choose an icon that names the
DATA, not the action (`Mail` for an e-mail, `CalendarDays` for a date). The
only exempt controls are `Switch`, `Checkbox`, file inputs and inline renames,
whose own control is the affordance.

## `affordances-belong-to-the-design-system`

How a control looks and behaves is defined once in `src/app/globals.css` or the
primitive, never sprinkled per screen: clickable elements show the pointer
cursor, disabled controls show `not-allowed`, icons come from `lucide-react`.
Never build a clickable element from a bare `<div>` with an `onClick` and no
role.

## `interactive-states-must-be-visible-in-both-themes`

Hover, focus, active and disabled must be visibly distinct in **both** themes.
Dark mode is where this fails: a hover one or two lightness steps above the
surface reads as no change at all. Use the dedicated `--sm-hover` /
`--sm-active` tokens rather than the static `--sm-surface2`, and check a status
fill actually reads against the dark background before shipping it.

## `five-view-states`

Every view that renders remote data implements loading, empty, error, forbidden
and not-found. A view that only handles the happy path is unfinished.

---

## Additional Workflow Rules

| #   | Rule                                                                                     |
| --- | ---------------------------------------------------------------------------------------- |
| 1   | **Post-code review** — after writing code, list edge cases and suggest test cases        |
| 2   | **Limit scope** — if a task touches more than 3 files, break it into smaller tasks first |
| 3   | **Bug-fix workflow** — write a reproducing test first, then fix until the test passes    |

---

## 🚨 Non-Negotiable Rules — All Tasks

> **These rules are mandatory for every agent, every task, and every session.**

> **⛔ You are absolutely prohibited from violating any rule stated in this file.**
> Rule violations are not permitted under any circumstance — not when a skill is active,
> not when a sub-agent is running, not when the user asks informally, and not when the
> implementation appears simpler without the rules. If following a rule creates a conflict,
> stop and ask the user for guidance. There are no exceptions.

1. **Plan before coding**
   - ✅ Do: Describe your approach and wait for approval.
   - ❌ Don't: Start coding immediately without confirming the plan.
   - Example: "Plan: update `src/foo.ts` and `src/bar.ts`, then run lint on both. Proceed?"

2. **Clarify ambiguity**
   - ✅ Do: Ask questions when unclear.
   - ❌ Don't: Make assumptions and write code based on them.
   - Example: "Should this change apply to admins only, or all authenticated users?"

3. **No shell redirection to write files**
   - ✅ Do: Use Write/Edit tools (tracked diffs, rollback).
   - ❌ Don't: Use `cat > file << EOF` or any shell redirect to create/modify files.
   - Example: Edit `src/app/page.tsx` with file tools; never write via heredoc.

   ```ts
   // ✅ Good — use file tools (Write, Edit, Read, Grep)
   // ❌ Bad — shell redirects (untracked, no rollback)
   ```

4. **No new REST routes**
   - ✅ Do: Add a GraphQL query/mutation for new operations.
   - ❌ Don't: Create `route.ts` outside `api/auth/` or `api/graphql/`.
   - Example: Add `type Mutation { doSomething(input: Foo!): Bar }` instead of `src/app/api/foo/route.ts`.

   ```ts
   // ❌ Bad — creating a REST route
   // export async function GET() { ... } // src/app/api/foo/route.ts
   // ✅ Good — add a GraphQL mutation
   // type Mutation { doSomething(input: Foo!): Bar }
   ```

5. **No `router.refresh()`**
   - ✅ Do: Use optimistic updates + `invalidateQueries` to keep UI in sync.
   - ❌ Don't: Call `router.refresh()` after mutations.
   - Example: `onSettled: () => queryClient.invalidateQueries({ queryKey: ['key'] })`.

   ```tsx
   // ❌ Bad
   const mutation = useMutation({
     onSuccess: () => router.refresh(),
   });

   // ✅ Good
   const mutation = useMutation({
     onMutate: async () => {
       // optimistic update
     },
     onError: (_, __, context) => {
       // rollback
     },
     onSettled: () => queryClient.invalidateQueries({ queryKey: ['key'] }),
   });
   ```

6. **Always inline form errors**
   - ✅ Do: Use `error?` prop on wrappers, `iErrCls` on inputs, and `onInvalid` handler.
   - ❌ Don't: Show errors in a toast/alert or skip validation feedback.
   - Example: `<Input error={errors.name?.message} {...register('name')} />` with inline message text.

   ```tsx
   // ✅ Good
   <Input error={errors.name?.message} {...register('name')} />;
   {
     errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>;
   }

   // ❌ Bad
   // toast.error("Veuillez remplir tous les champs")
   ```

7. **Never spread DTOs into React Hook form `defaultValues`**
   - ✅ Do: Map fields explicitly in a `toForm()` helper.
   - ❌ Don't: Use `defaultValues: { ...apiDto }` (extra keys fail silently).
   - Example: `return { name: dto?.name ?? '', category: dto?.category ?? 'streaming' };`

   ```ts
   // ❌ Bad
   // const form = useForm({ defaultValues: { ...apiDto } });

   // ✅ Good
   function toForm(dto?: ServiceDto): ServiceForm {
     return { name: dto?.name ?? '', category: dto?.category ?? 'streaming' };
   }
   ```

8. **Prefer file tools over CLI**
   - ✅ Do: Use Read, Write, Edit, Glob, and Grep tools.
   - ❌ Don't: Use `cat`, `grep`, `sed`, `awk`, or `find` from shell.
   - Example: Use `read_file` + `grep_search` to inspect and locate code safely.

9. **Image uploads are server-side**
   - ✅ Do: Send base64 from client to `uploadImage` mutation; upload via Cloudinary SDK on server.
   - ❌ Don't: Send Cloudinary credentials to the browser.
   - Example: Client sends base64 payload; resolver performs the Cloudinary upload.

10. **Always use the `env` object**
    - ✅ Do: `import { env } from '@/lib/settings/env'`.
    - ❌ Don't: Use `process.env.*` directly in application code.
    - Example: `const db = new Pool({ connectionString: env.DATABASE_URL });`

    ```ts
    // ❌ Bad
    // const db = new Pool({ connectionString: process.env.DATABASE_URL });

    // ✅ Good
    import { env } from '@/lib/settings/env';

    const db = new Pool({ connectionString: env.DATABASE_URL });
    ```

11. **Use the logger everywhere**
    - ✅ Do: Server: `createLogger('module')`; Client: `clientLogger('module')`.
    - ❌ Don't: Use `console.log()` / `console.error()` in any file.
    - Example: `log.info({ userId: user.id }, 'User created')`.

    ```ts
    // ❌ Bad
    // console.log('User created', user);

    // ✅ Good (server)
    // import { createLogger } from '@/lib/logger';
    // const log = createLogger('users');
    // log.info({ userId: user.id }, 'User created');

    // ✅ Good (client)
    // import { clientLogger } from '@/lib/logger/client-logger';
    // const log = clientLogger('users');
    // log.info('User created');
    ```

12. **Never write direct DB queries in non-repository files**
    - ✅ Do: Call exported repository functions.
    - ❌ Don't: Use `db.select()` or raw SQL in resolvers, components, or pages.
    - Example: `const users = await getUsers()` from `users.repository.ts`.

    ```ts
    // ❌ Bad — in a resolver or component
    // const users = await db.select().from(usersTable);

    // ✅ Good — call repository function
    // import { getUsers } from '@/lib/db/repositories/users.repository';
    // const users = await getUsers();
    ```

13. **No git write ops without instruction**
    - ✅ Do: Use `git log`, `git diff`, `git status` (always fine).
    - ❌ Don't: Run `git add`, `git commit`, `git push` without explicit request.
    - Example: Share `git diff` output first, then wait for explicit commit instruction.

14. **No DB write ops without approval**
    - ✅ Do: Describe what will change, ask in plain terms, and wait for "yes".
    - ❌ Don't: Run INSERT/UPDATE/DELETE/migrations without explicit approval.
    - Example: "This migration updates `customers.status`; proceed?"

15. **Skip heavy plan docs**
    - ✅ Do: Keep brief outlines (approach + file list) in code comments.
    - ❌ Don't: Put implementation code in `.md` plan files.
    - Example: Provide a concise 5-8 bullet execution outline in chat.

16. **Deep review before calling work done**
    - ✅ Do: Before reporting a task complete — and whenever the user asks
      for a review — run a three-axis review of the changed surface, using
      the `code-review` skill plus, when the surface is large, one reader per
      axis:
      1. **Standards** — `AGENTS.md`, `CLAUDE.md`, `DESIGN.md`, and the
         smell baseline (Mysterious Name, Duplicated Code, Feature Envy,
         Data Clumps, Primitive Obsession, Repeated Switches, Shotgun
         Surgery, Divergent Change, Speculative Generality, Message Chains,
         Middle Man, Refused Bequest).
      2. **Business intent** — every `QUEUE.md` shipped entry and `DESIGN.md`
         rule the change claims to satisfy: is it actually implemented, and
         does it mean what was agreed?
      3. **Correctness** — the scenario that breaks it: empty and huge
         inputs, ties and ordering, money and rounding, mixed currencies,
         concurrent writes, stale caches, null timestamps, characters the
         stack cannot encode, authorization across tenants, and what the
         screen shows when a dependency fails.
    - ❌ Don't: Treat "tests pass, types pass, lint pass" as evidence the
      feature is correct. Those prove it compiles, not that it is right.
    - Don't report a feature complete while a finding you surfaced is still
      open: fix it, or state plainly that it is open and why.
    - Example: a PDF renderer that passes every test but crashes on an
      Arabic customer name has to be found by reading the encoding path, not
      by running the suite.

17. **Announce skills before use**
    - ✅ Do: Tell which skill you will use and why before invoking.
    - ❌ Don't: Invoke silently without warning.
    - Example: "Using `writing-plans` to turn approved requirements into tasks."

18. **Ask approval for token-heavy skills**
    - ✅ Do: Warn the user and offer granular opt-out.
    - ❌ Don't: Spawn sub-agents without asking.
    - Example: "This step uses a token-heavy skill; do you want me to proceed?"

19. **Announce skills before long-running tasks**
    - ✅ Do: Say which implementation skill you will use and why before invoking.
    - ❌ Don't: Silently invoke long-running or multi-step implementation skills.
    - Example: "I'm going to use `executing-plans` to run the approved implementation in phases."

- Good: "I'm going to use `writing-plans` to turn the approved spec into a detailed implementation plan."
- Bad: Invoking a skill without any prior announcement.
- Applies to: `writing-plans`, `executing-plans`, `subagent-driven-development`, `dispatching-parallel-agents`,
  `test-driven-development`, and any skill that drives implementation work.

19. **Max 300 lines per `.ts`/`.tsx` file**
    - ✅ Do: Split types, constants, helpers, sections, and utilities immediately.
    - ❌ Don't: Let files grow past 300 lines without splitting.
    - Example: Extract `*-types.ts`, `*-helpers.ts`, and `*-sections.tsx` once a file approaches the limit.

- Strategy:
  - Extract logical groups into separate files: `*-types.ts`, `*-sections.ts`, `*-constants.ts`, `*-helpers.ts`, and
    `*-utils.ts`.
  - Keep the original as a barrel file with re-exports if needed for backwards compatibility.
  - For large constants, split by category.
- Exceptions (up to 400 lines): `*.renderer.tsx` files and auto-generated shadcn/ui files.

20. **Exports at top of file**
    - ✅ Do: Place exported declarations as high as possible.
    - ❌ Don't: Hide exported code below helper implementations.
    - Example: `export function Feature()` appears above non-exported helpers when possible.

```ts
// ✅ Good
export function MainFeature() {
  return helperFunction();
}

function helperFunction() {
  // ...
}

// ❌ Bad
function helperFunctionBad() {
  // ...
}

export function MainFeatureBad() {
  return helperFunctionBad();
}
```

21. **Tests must cover real behavior and edge cases**
    - ✅ Do: Cover meaningful success paths, failure paths, authorization boundaries, null/error returns, and edge cases
      that can realistically break behavior.
    - ❌ Don't: Write happy-path-only tests, superficial existence tests, or tests added just to increase count without
      validating behavior.
    - Example: For a restore use case, test missing records, unauthorized access, invalid state transitions, downstream
      repository failures, and the successful restore path.

22. **Never sign commits with AI co-authorship**
    - ✅ Do: Write commit messages with message text only.
    - ❌ Don't: Add `Co-Authored-By: Claude`, `Co-Authored-By: Codex`, `Claude-Session:`, "Generated with Claude Code",
      or any other AI/agent attribution or signing trailer.

---

---

## API-Specific Rules

### 3-Layer Architecture (API)

Every feature follows: **Resolver → UseCase → Repository**

```
src/features/<domain>/
  resolvers/      ← thin GraphQL dispatchers
  use-cases/      ← business logic
  repositories/   ← Drizzle queries only
  schemas/        ← graphql/ validators/ model/
```

**Never:**

- Write SQL directly in resolvers
- Call repository functions from client code
- Mix business logic with data access

### Encryption Standard (API)

- **Algorithm**: AES-256-GCM (Node.js `crypto` module)
- **Format**: `iv:authTag:ciphertext` (all hex-encoded, colon-separated)
- **Use cases**: PIN codes, sensitive credentials
- **Key management**: `.env` variable or secure vault (not hardcoded)

### GraphQL Schema (API)

- **Feature-local SDL**: `src/features/<domain>/schemas/graphql/*.schema.ts`
- **Feature-local resolvers**: `src/features/<domain>/resolvers/*.resolvers.ts`
- **Merge entry points**:
  - `src/lib/graphql/schema.ts`
  - `src/lib/graphql/resolvers.ts`

### Global API Contract (API)

- **Input pattern**: Prefer `query/mutation(input: InputType!)` for operation arguments; avoid mixed argument shapes.
- **Response shape**: Keep DTO fields stable for the same entity across list/get/mutation responses.
- **Pagination**: List queries return connection objects with `items` and `pageInfo`.
- **Error contract**: Validation/domain/auth errors expose machine-readable GraphQL `extensions.code` for frontend
  handling.
- **Prefix constants**: Never hardcode entity prefixes inline. Define them once in shared API constants and reuse across
  validators, middleware, and ID generation helpers.

---

## App-Layer Rules (Next.js 16)

### Auth.js v5

- **Configuration**: `src/lib/auth/auth.ts` (Node runtime: Credentials + GitHub providers, callbacks).
  `src/lib/auth/auth.config.ts` is the edge-safe half used by `src/proxy.ts` — it must never import the database layer.
- **Session**: Auth.js owns the browser session outright. Providers call the login use-cases in-process; the returned
  `auth_sessions` row id is stored in the JWT as `sessionId` and re-checked on every GraphQL request, so revoking a
  session logs the user out on their next request. There are **no access or refresh tokens** — never reintroduce one
  into the session payload.
- **Routes**: Auto-generated at `/api/auth/*` (Auth.js convention)
- **Guards**: `requireSession()` in Server Actions; `hasSignedInSession` / `hasValidConsoleSession` for routing
- **Session access**: `auth()` server-side; `useSession()` in client components

### Data Access

**Client components never touch GraphQL or the server layer directly.**

```
Client component
  ↓ (React Query hook)
Server Action  — or an RSC loader
  ↓ gqlRequest → Yoga pipeline, same process, no socket
Resolver → UseCase → Repository
  ↓ (Drizzle ORM)
PostgreSQL
```

`/api/graphql` stays a real route handler for external clients and GraphiQL.
Server code must not fetch it over HTTP: an RSC calling its own server can
stall during build and prerender.

### React Query Pattern (Frontend)

- **Hooks location**: `src/modules/<domain>/client/queries/use-<domain>.queries.ts`
- **Operations**: Typed GraphQL operations in `src/modules/<domain>/client/graphql/<domain>.operations.ts`
- **Mutations**: Always `onMutate` (optimistic) → `onError` (rollback) → `onSettled` (invalidate)
- **initialData**: Passed from server page to avoid loading state on first render
- **No `router.refresh()`**: Use `invalidateQueries` in `onSettled` instead

---

## File Naming Convention (Both Packages)

Domain files use a **`<name>.<type>.ts`** double-extension for IDE filtering:

### API Files

- GraphQL SDL slices
  - Suffix: `.schema.ts`
  - Example: `customers.schema.ts`
- GraphQL resolvers
  - Suffix: `.resolvers.ts`
  - Example: `customers.resolvers.ts`
- Use cases (business)
  - Suffix: `.use-case.ts`
  - Example: `create-customer.use-case.ts`
- Repository (DB)
  - Suffix: `.repository.ts`
  - Example: `customers.repository.ts`
- Validation schemas
  - Suffix: `.validators.ts`
  - Example: `customers.validators.ts`
- Models / DTO types
  - Suffix: `.model.ts`
  - Example: `customers.model.ts`

### Frontend Files

- GraphQL operations
  - Suffix: `.operations.ts`
  - Example: `customers.operations.ts`
- React Query hooks
  - Suffix: `.queries.ts`
  - Example: `use-customers.queries.ts`
- Components
  - Suffix: `.tsx`
  - Example: `customer-editor.tsx`

Index/entry files (`schema.ts`, `resolvers.ts`, `operations.ts`) keep plain names — they aggregate and re-export.

---

## Domain Model (Canonical Names)

**Single source of truth**: `docs/rebuild/plans-shared.md`

Core entities (use exact names):

### Customer

A person/organization buying memberships. Represents the end user of the streaming reseller.

- **Fields**: id, name, email, phone, notes, isActive, createdAt, updatedAt
- **ID format**: `cst_<uuid>` with human-readable slug `CST-NNNN`

### Membership

Records which Customer subscribed to which Plan, on what dates.

- **Fields**: id, customerId, planId, startDate, endDate, status, isRecurring, renewedFromId, createdAt, updatedAt
- **ID format**: `mbr_<uuid>` with human-readable slug `MBR-YYYY-NNNN`

### Payment

Tracks every payment tied to a Membership.

- **Fields**: id, membershipId, customerId, dueDate, paidDate, amount, currencyCode, status, createdAt, updatedAt
- **Status**: `unpaid`, `paid`, `overdue`, `cancelled`

### Service

A streaming service (Netflix, Disney+, etc.).

- **Fields**: id, name, category, description, logoUrl, isActive, createdAt, updatedAt

### Plan

A pricing tier for a Service or Promotion (e.g., "Netflix Standard 1 month").

- **Fields**: id, name, durationMonths, price, currencyCode, planType, serviceId XOR promotionId, createdAt, updatedAt
- **Key rule**: A plan belongs to **either** a Service **or** a Promotion — never both

### Promotion

A bundle of multiple services sold together.

- **Fields**: id, name, description, isActive, createdAt, updatedAt

### StreamingAccount

A real account owned by the reseller (e.g., a Netflix account credentials).

- **Fields**: id, serviceId, label, supportsProfiles, maxProfiles, createdAt, updatedAt
- **Purpose**: Hold actual streaming service account data; linked to Memberships via StreamingProfile assignment

### StreamingProfile

A named profile/user within a StreamingAccount.

- **Fields**: id, accountId, name, pinEncrypted (AES-256-GCM), metadata, createdAt, updatedAt
- **PIN format**: `iv:authTag:ciphertext` (hex-encoded, colon-separated)

### StreamingProfileAssignment

Junction linking a Membership to a StreamingAccount (optionally to a specific StreamingProfile).

- **Fields**: id, membershipId, accountId, profileId (nullable), assignedAt
- **Purpose**: Track which streaming credentials/profiles are assigned to which memberships

---

## Default Currency & Localization

- **Default currency**: `MAD` (Moroccan Dirham, symbol: DH)
- **Stored as**: Key-value in DB table `app_settings` (key: `defaultCurrency`)
- **Per-field rule**: Every price column has an adjacent `currencyCode` column
- **Changing default**: Affects **new** prices only — existing records keep their currency
- **Display**: Use `formatCurrency(amount, currencyCode)` helper for formatting
- **Language**: All UI strings should be translateable (support French + English minimum)

---

## Authorization & User Roles

- `admin`
  - Access: Full CRUD on all entities, all console/settings routes.
- `accountant`
  - Access: Read-only dashboard, analytics, and shared summary link view.
- `user`
  - Access: Default role after signup; no console access until promoted.

**App layer:**

- Session check via `auth()` in `src/proxy.ts` → redirect unauthenticated to the login route
- Role check in page layout → show/hide console nav based on `session.user.role`
- Server Actions call `requireSession()` before touching data

**Server layer:**

- Role enforcement in resolvers via `context.user.role` (`requireAuth` / `requireAdmin`)
- Throw `GraphQLError(FORBIDDEN)` if user lacks required role

---

## Implementation Prompts

Detailed implementation steps are in:

- **API**: `docs/rebuild/prompt-api.md` (10 phases, all facts inline)
- **Frontend**: `docs/rebuild/prompt-frontend.md` (8 phases, all facts inline)

Both are **self-contained** — read them before starting any implementation work. They serve as agent prompts and as
executable checklists.

---

## Common Pitfalls (learn from past mistakes)

### API Pitfalls

- **Direct DB query in resolver**
  - What goes wrong: Bypasses use case/repository layers (rule #3).
  - Fix: Call repository from the use case, and the use case from the resolver.
- **Mixing validation into business logic**
  - What goes wrong: Hard to test and hard to reuse.
  - Fix: Validate in `schemas/validators/*.validators.ts` with Zod before the handler.
- **Top-level import of `db` client**
  - What goes wrong: DB client tied to module initialization; hard to mock.
  - Fix: Import inside functions; use dependency injection.
- **AES-256-GCM with wrong IV/tag format**
  - What goes wrong: Decryption fails silently and corrupts data.
  - Fix: Always use `iv:authTag:ciphertext` format.
- **Throwing plain Error instead of GraphQLError**
  - What goes wrong: GraphQL does not properly format error responses.
  - Fix: Use `throw new GraphQLError(message, { ... })`.
- **Bare Zod `.optional()` on GraphQL input fields**
  - What goes wrong: Every non-`!` SDL input field is nullable — clients legitimately send `null` for
    "not set". `z.boolean().optional()` rejects `null` with `BAD_USER_INPUT`
    (e.g. `allowExpiredPromotion: Invalid input: expected boolean, received null`).
  - Fix: Wrap optional GraphQL input fields with `gqlOptional(schema)` from
    `src/features/common/schemas/validators/gql-optional.validators.ts` (coerces `null` → `undefined`). Reserve
    `.nullable()` for fields where `null` is meaningful (e.g. "clear this value", like
    `paidDate`/`notes`). Never leave a bare `.optional()` on a field a GraphQL client can set.

### Frontend Pitfalls

- **Spreading GQL object into RHF `defaultValues`**
  - What goes wrong: Extra keys fail `zodResolver` silently.
  - Fix: Map fields explicitly in a `toForm()` helper.
- **`router.refresh()` after mutation**
  - What goes wrong: Full SSR round-trip and loading flash.
  - Fix: Use `invalidateQueries` in `onSettled`.
- **Direct HTTP fetch from browser**
  - What goes wrong: No types, no optimistic update, violates BFF pattern.
  - Fix: Always use a React Query hook backed by GraphQL.
- **Top-level DB import in a shared module**
  - What goes wrong: `pg`/`postgres` driver (`net`/`tls`) is pulled into browser bundle -> `Module not found: 'net'`.
  - Fix: Use `dynamic import()` inside the async function body; never top-level import a DB repo from files shared
    with client code.
- **`process.env.*` direct access**
  - What goes wrong: Bypasses `@t3-oss/env-nextjs` validation, loses TypeScript types, and ignores client/server
    boundaries.
  - Fix: Always use `import { env } from '@/lib/settings/env'` and add new vars to schema + `runtimeEnv`.
- **`console.*` in server or client code**
  - What goes wrong: Bypasses log levels, routing, structured context, redaction, and forwarding.
  - Fix: Server uses `createLogger('module')`; client uses `clientLogger('module')`.
- **Hardcoding route strings**
  - What goes wrong: Breaks on rename and prevents safe refactors.
  - Fix: Import from `ROUTES` in `src/lib/config/routes.ts`.
- **Passing conflicting Tailwind utilities through `className` into UI primitives**
  - What goes wrong: `cn()` runs tailwind-merge — a consumer utility from the same group **replaces** the primitive's
    base utility instead of adding to it. Example: `<DialogContent className="relative">` silently deletes the base
    `fixed`, so `top-1/2` offsets the dialog from its flow position and it renders at the bottom of the page instead
    of centered. The same applies to `translate-*`, `z-*`, `overflow-*`, and display utilities.
  - Fix: Never pass position (`static`/`relative`/`absolute`/`fixed`/`sticky`), `translate-*`, or `z-*`
    classes into `DialogContent`, `AlertDialogContent`, `SheetContent`, `PopoverContent`, `SelectContent`,
    `DropdownMenuContent`, or `TooltipContent`. A `fixed` popup is already a containing block for absolute children —
    `relative` is never needed on it. If an override is genuinely required, change the primitive in
    `src/components/ui/` itself. Enforced by
    `src/components/ui/portal-classname-conflict.contract.test.ts` — `pnpm test` fails on violations.

### Layering Pitfalls

- **Client component imports `src/server/`**
  - What goes wrong: postgres, argon2 and secrets get pulled into the browser bundle; the build fails or leaks.
  - Fix: go through a Server Action or an RSC loader.
- **Server code fetching `/api/graphql` over HTTP**
  - What goes wrong: an RSC calling its own server can stall during build and prerender.
  - Fix: use `gqlRequest`, which runs the Yoga pipeline in-process.
- **Creating a database client at module scope without caching**
  - What goes wrong: Next re-evaluates modules on HMR and per route bundle, opening a new pool each time until the database runs out of connection slots.
  - Fix: reuse the `globalThis`-cached pool in `src/server/lib/db/client.ts`.
- **Importing the DB layer into middleware**
  - What goes wrong: `src/proxy.ts` cannot bundle native modules.
  - Fix: middleware uses the edge-safe `src/lib/auth/auth.config.ts`.
- **Using old entity names (`Client`, `Account`, etc.)**
  - What goes wrong: Conflicts with auth and confuses business logic.
  - Fix: Always use `Customer`, `Membership`, `StreamingAccount`, `StreamingProfile`.

---

## TypeScript Rules

- **`import type` for type-only imports** — never `import { type Foo }`; use `import type { Foo }`
- **No `any`** — use `unknown` + narrowing or proper types
- **Max 300 lines per file** — split immediately when a `.ts`/`.tsx` file exceeds 300 lines.
  - Extract into: `*-types.ts`, `*-constants.ts`, `*-helpers.ts`, `*-utils.ts`, `*-sections.tsx`
  - Keep the original as a barrel with re-exports for backwards compatibility if needed
  - Exceptions (up to 400 lines): visual renderers (`*.renderer.tsx`), auto-generated shadcn/ui files
  - Split directly — do not use token-intensive skills; sub-agents are fine for parallel independent files

- **Absolute imports** — one alias, `@/` → `src/`:
  - `import { getCustomers } from '@/server/features/customers/repositories/customers.repository'`
  - `import { useCustomers } from '@/features/customers/ui/queries/use-customers.queries'`

- **Direction** — the app layer may import `@/server/...` from server-only files (loaders, Server Actions, route handlers). The server layer must never import from `@/features/*/ui/` or `@/components/`.

- **Exports at top of file** — place exported functions, classes, types, and constants at the top; non-exported helpers
  go below. Exception: when hoisting is impossible due to initialization order.

  ```ts
  export function main() { return helper() }  // ✅ exported first

  function helper() { ... }                   // ✅ helper below
  ```

- **Named `function` declarations over arrow variables** — for any non-trivial function (more than a one-liner), prefer
  `function foo() {}` over `const foo = () => {}`.

- **For default exports**, use the `export default function` syntax directly on the function declaration, not as a
  separate statement.

- **Avoid nested ternary expressions.** If a ternary would be nested, extract the condition or result to a variable or
  function instead.

---

## React Rules (Frontend Only)

- **Never use native HTML interactive elements** — always use library components instead.
  - `<input>`, `<textarea>` -> `Input`, `Textarea` from `src/components/ui/`
  - `<select>`, `<option>` -> `Select` / `SelectContent` / `SelectItem` from the UI library
  - `<input type="date">` -> `Calendar` + `Popover` (shadcn/ui + `react-day-picker`)
  - `<button>` -> `Button` from `src/components/ui/button.tsx`
  - `<dialog>`, `window.alert`, `window.confirm` -> `Dialog`, `AlertDialog`, `Sheet` from shadcn/ui
  - `<label>` -> `Label` from `src/components/ui/label.tsx`

  **Icons:** use `lucide-react` or `react-icons` — never inline SVG or emoji for interactive icons.

  **Missing component:** scaffold from [@radix-ui](https://www.radix-ui.com/) primitives following the existing shadcn
  pattern, then import it.

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

- **Prerequisite gating in create/assign dialogs** (frontend only):
  - Any dialog whose form references another entity (payment → membership, promotion → service, membership → plan +
    customer, plan → service/promotion, account → service, profile assignment → active membership) must render
    `PrerequisiteOverlay` (from
    `src/components/console/shared/prerequisite-overlay.tsx`) when the referenced options are empty, linking to the
    console page where the missing entity is created. A disabled submit button alone is not sufficient. Each gated
    form has a colocated `*-prereq-contract.test.ts` asserting the gate.

- **React Query pattern** (frontend only):
  - Every mutation: `onMutate` (optimistic) → `onError` (rollback) → `onSettled` (invalidate)
  - Use `initialData` from server page — no loading state on first render
  - Never call `router.refresh()` — use `invalidateQueries` instead

---

## Next.js Rules (Frontend Only)

- **Read the docs before writing any code** — Next.js 16 has breaking changes. Check `node_modules/next/dist/docs/`
  before starting. Heed deprecation notices.

- **Validate env vars with `@t3-oss/env-nextjs`** — all env vars must be validated in `src/lib/settings/env.ts`. Keep
  server-only vars separate from `NEXT_PUBLIC_*` client vars.

- **App Router conventions**:
  - Server Components by default (no `'use client'` unless state/effects needed)
  - Route groups with parentheses: example `(auth)/`, `(dashboard)/`, `(website)/`
  - Parallel routes for multi-panel layouts
  - Dynamic segments for parameterized routes

---

## Server Layer Rules (`src/server/`)

- **Validate at the edge** — resolvers run Zod validation and auth guards before calling a use case

- **Error handling** — throw `AppError` / `GraphQLError` with proper codes; Yoga masks 500s in production

- **Dependency injection** — use cases take their collaborators as a `dependencies` parameter with a default, so tests can substitute them

- **No side effects in resolvers** — resolvers call use cases; use cases never query the DB directly, repositories do

- **Lazy DB import in repositories** — `await import('@/server/lib/db/client')` inside the function, not at module top level

- **Mark server-only modules** — `import 'server-only'` in modules that must never reach the browser

---

<!-- END:monorepo-agent-rules -->
