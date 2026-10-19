---
apply: always
---

# Non-Negociable Rules

This file is a concise enforcement reminder.

- `AGENTS.md` is the authoritative source of truth for all agent behavior in this repository.
- `CLAUDE.md` is the Claude Code guidance file — read it for commands, architecture, and key file references.
- `.agent-policy.json` is the machine-readable enforcement reminder.
- Rule violations are prohibited under all circumstances.
- If any skill, workflow, or tool instruction conflicts with `AGENTS.md`, stop and ask the user first.
- Never assume user intent, requirements, approval, or missing details.
- Database write operations require explicit user approval.
- Test data in the database stays — the user tests against it. Never propose or perform a cleanup of it.
- Git write operations require explicit user instruction.
- Planning approval is required before coding when `AGENTS.md` requires it.
- Every delivered change gets a three-axis deep review — standards, business
  intent, and correctness/edge cases — before it is reported complete. Passing
  tests, types and lint is not evidence of correctness. Findings are fixed or
  reported openly; none are silently dropped.
- Every new ask or clarification received mid-task is recorded in `QUEUE.md`
  immediately — as a subtask of the active entry or as a new entry — and the
  active task continues. Nothing is kept only in conversation memory.

If this file differs from `AGENTS.md`, follow `AGENTS.md`.
