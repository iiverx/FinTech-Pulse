---
name: Nabd Backend Architecture
description: Key facts about the api-server, database, and session setup for the nabdh-pulse project
---

## Session Store
- `connect-pg-simple` must stay in `external` list in `build.mjs` or sessions break at runtime.

## Database
- Package: `@workspace/db` at `lib/db/`
- Schema files: `lib/db/src/schema/{users,savings,nabd,conversations,messages}.ts`
- `drizzle-kit push` requires a TTY — cannot run non-interactively. Use `executeSql` via CodeExecution to apply raw DDL instead.
- **Critical**: The `users` table was NOT created by the initial drizzle push (it asked interactive questions and aborted). Must be created manually via SQL. All other tables existed except `users`, `financial_pulse`, `conversations`, `messages`.

**Why:** drizzle-kit push prompts interactively when schemas differ; in a non-TTY environment it throws "Interactive prompts require a TTY terminal" and exits without creating tables.

**How to apply:** When adding new schema tables or after a fresh environment, run CREATE TABLE IF NOT EXISTS directly via the database executeSql callback in CodeExecution.

## Vite Proxy
- Frontend (`nabdh-pulse`) proxies `/api` → `http://localhost:8080` in `vite.config.ts`.
- Without this proxy, all auth and API calls silently fail (fetch goes to Vite's dev server, not the API server).

## API Server Port
- API server consistently listens on port 8080 (assigned by Replit artifact system).

## Dashboard Navigation
- Dashboard uses `?section=<key>` URL param for deep-linking from other pages (calculator sidebar, savings sidebar, landing features).
- Valid section keys: `home | pulse | alerts | simulation | assistant | community | settings`
