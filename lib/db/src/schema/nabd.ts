import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

// ── Income ────────────────────────────────────────────────────────────────────
export const incomeTable = pgTable("income", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().unique(),
  monthlySalary: integer("monthly_salary").notNull().default(0),
  salaryDay: integer("salary_day").notNull().default(1),
  hasExtraIncome: boolean("has_extra_income").notNull().default(false),
  extraIncomeAmount: integer("extra_income_amount").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Income = typeof incomeTable.$inferSelect;

// ── Obligations ───────────────────────────────────────────────────────────────
export const obligationsTable = pgTable("obligations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  dueDate: integer("due_date"),       // day of month (1–31)
  isRecurring: boolean("is_recurring").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Obligation = typeof obligationsTable.$inferSelect;

// ── Budget ────────────────────────────────────────────────────────────────────
export const budgetTable = pgTable("budget", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  category: text("category").notNull(),
  monthlyLimit: integer("monthly_limit").notNull(),
  currentSpending: integer("current_spending").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Budget = typeof budgetTable.$inferSelect;

// ── Financial Goals ───────────────────────────────────────────────────────────
export const goalsTable = pgTable("goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  goalType: text("goal_type").notNull(),
  targetAmount: integer("target_amount").notNull(),
  currentAmount: integer("current_amount").notNull().default(0),
  deadline: timestamp("deadline", { withTimezone: true }),
  monthlyRequiredAmount: integer("monthly_required_amount"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Goal = typeof goalsTable.$inferSelect;

// ── Financial Transactions ────────────────────────────────────────────────────
export const transactionsTable = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),           // income | expense
  category: text("category").notNull(),
  amount: integer("amount").notNull(),
  description: text("description"),
  transactionDate: timestamp("transaction_date", { withTimezone: true }).notNull().defaultNow(),
  paymentMethod: text("payment_method"),
  source: text("source"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Transaction = typeof transactionsTable.$inferSelect;

// ── Financial Pulse Score ─────────────────────────────────────────────────────
export const financialPulseTable = pgTable("financial_pulse", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  score: integer("score").notNull(),
  status: text("status").notNull(),
  spendingIncomeRatio: integer("spending_income_ratio"),
  budgetCommitment: integer("budget_commitment"),
  savingGrowth: integer("saving_growth"),
  obligationsScore: integer("obligations_score"),
  behaviorScore: integer("behavior_score"),
  goalsScore: integer("goals_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FinancialPulse = typeof financialPulseTable.$inferSelect;

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsTable = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // info | warning | alert | success
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Notification = typeof notificationsTable.$inferSelect;

// ── Activity Logs ─────────────────────────────────────────────────────────────
export const activityLogsTable = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  action: text("action").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ActivityLog = typeof activityLogsTable.$inferSelect;

// ── Community Profiles (seeded from CSV for anonymous comparison) ──────────────
export const communityProfilesTable = pgTable("community_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  csvUserId: integer("csv_user_id").notNull(),
  avgMonthlyIncome: integer("avg_monthly_income").notNull(),
  avgSavings: integer("avg_savings").notNull(),
  avgObligations: integer("avg_obligations").notNull(),
  avgTotalSpending: integer("avg_total_spending").notNull(),
  incomeBracket: text("income_bracket").notNull(), // low | medium | high | very_high
  pulseScore: integer("pulse_score").notNull(),
});

export type CommunityProfile = typeof communityProfilesTable.$inferSelect;
