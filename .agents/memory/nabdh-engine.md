---
name: Nabdh Scoring Engine
description: TypeScript port of the Python nabdh_pipeline.py algorithm — weights, caps, column mapping, and validation notes
---

## Algorithm Location
`artifacts/api-server/src/services/nabdh-engine.service.ts`

## Weights (must sum to 1.0)
- Savings:    0.15  (قاعدة 50/30/20 — ادخار 20%+ مثالي)
- Debt:       0.20  (DTI — لا تتجاوز 36%)
- Housing:    0.10  (لا تتجاوز 30% من الدخل)
- Balance:    0.30  (الأكثر أهمية — الرصيد المتبقي)
- Trend:      0.15  (slope of balance ratio over months)
- Volatility: 0.10  (std dev of balance ratio)

## Hard Caps (override raw score)
- `deficitCap(avgBalanceRatio)`: if avg balance < 0, cap = 65 - severity*30 (max 65)
- `debtCap(avgDebtRatio)`: if DTI > 36%, cap = 75 - severity*45 (max 75)
- Final score = min(rawScore, min(deficitCap, debtCap))

## Single-Month Behavior
- With 1 month: trend = 0, volatility = 50 (neutral)
- With 2+ months: real trend (linear regression slope) and volatility (sample std dev)

**Why:** Matching Python pipeline behavior — single months can't compute trend/volatility.

## DB Column Mapping (financial_pulse table)
Old column names are reused with new meanings:
- `spendingIncomeRatio` → spend % of income (raw ratio for display)
- `savingGrowth`        → savings sub-score (0-100)
- `obligationsScore`    → debt sub-score (0-100)
- `budgetCommitment`    → balance sub-score (0-100)
- `behaviorScore`       → trend sub-score (0-100)
- `goalsScore`          → volatility sub-score (0-100)

## New API Endpoints Added
- `GET /api/pulse/breakdown` — full nabdh result with ratios, caps, weight explanations
- `GET /api/pulse/validate` — runs 6 validation cases, returns allPassed + per-case results

## Category Mapping (budget table → nabdh input)
`buildMonthlyRecordFromBudget()` maps Arabic budget category names to nabdh slots:
- سكن/إيجار/مسكن → housing
- طعام ومطاعم/طعام/مطاعم → food
- مواصلات/نقل → transport
- ترفيه/ترفيه وهوايات → entertainment
- اشتراكات/اشتراكات رقمية → subscriptions
- loans come from obligationsTable (separate)

## Community Profiles
- 1000 profiles from CSV; re-seeded with nabdh engine (trend + volatility from 12 months)
- Seed uses inline copy of algorithm functions (avoids build circular deps in seed.mjs)
- CSV path: `attached_assets/Nabd_12_Months_Clean01_1784277638917.csv`

## Validation Results (Sara — 3 months of data)
- Score: 82.1/100 — "مستقر" ✅
- Savings ratio: 17.8% (just under 20% ideal)
- Debt ratio: 16% (safe, DTI standard)
- Balance ratio: 63.1% (excellent)
- allPassed: true for all 6 validation cases
