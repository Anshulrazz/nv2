# Notexia — Agent Conventions

## Stack
Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui, TipTap, MongoDB via
Mongoose, Auth.js (Credentials + Google, MongoDB adapter), Anthropic API for
chat, Zustand + TanStack Query.

## Rules
- No placeholder data where real functionality is expected. If something can't be
  fully implemented in this pass, say so explicitly instead of stubbing silently.
- Every feature ends in a verifiable deliverable: a screenshot, passing test, or
  a `curl`/script output showing the endpoint works.
- Keep API routes REST (not tRPC) for v1.
- All schema changes go through the Mongoose model files in src/models — no
  ad-hoc collections created by hand-written driver calls.
- Any deletion that has dependent documents (deleting a Chat deletes its
  embedded messages for free; deleting a User must explicitly delete their
  Folders/Notes/Chats too) — Mongo won't cascade this automatically.
- Loading/empty/error states are required on every list/detail view, not optional polish.
- Do not touch billing, admin, calendar, tasks, or multi-workspace code — out of
  scope for this phase (see Phase 2 Backlog in notexia-mvp-plan.md).
