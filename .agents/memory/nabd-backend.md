---
name: Nabd Backend Architecture
description: Complete backend for نبض | Pulse FinTech app — tables, routes, seed, and known quirks
---

## Stack
- Express.js + TypeScript + Drizzle ORM + PostgreSQL
- Session-based auth (connect-pg-simple) — **must be externalized in esbuild**, never bundled
- Seed: `pnpm --filter @workspace/api-server run seed` (builds seed.ts via build-seed.mjs then runs dist/seed.mjs)

## DB Tables (lib/db/src/schema/)
- users.ts: extended with phone, city, age, maritalStatus, housingType, dependentsCount, updatedAt
- nabd.ts: income, obligations, budget, goals, transactions, financial_pulse, notifications, activity_logs, community_profiles
- savings.ts: savings_transactions, savings_goals (original, unchanged)

## Key Route Files (artifacts/api-server/src/routes/)
users, finance, transactions, pulse, notifications, reports, simulation, assistant, community

## Services (artifacts/api-server/src/services/)
- pulse.service.ts: calculatePulseScore + simulatePurchaseImpact
- safe-spending.service.ts: calculateSafeDailySpending
- notification.service.ts: createNotification + generateSmartNotifications

## Demo User
- Email: sara@nabd.demo / Demo1234!
- 7,500 SAR/month, 1,200 SAR obligations, 4,000 SAR savings, pulse 78/100

## Community Data
- 1,000 user profiles seeded from Nabd_12_Months_Clean01 CSV (per-user 12-month averages)
- Stored in community_profiles table for anonymous comparison

## Known Quirks
- connect-pg-simple MUST be in externals (build.mjs) — it reads table.sql from disk
- Pulse score calculation gathers data across 5+ tables each time; cache if needed at scale
- safe-daily-spending uses savings_transactions as "spent so far" proxy (not transactions table)
