import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ── Savings Transactions ──────────────────────────────────────────────────────

export const savingsTransactionsTable = pgTable("savings_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  amount: integer("amount").notNull(),
  note: text("note"),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSavingsTransactionSchema = createInsertSchema(savingsTransactionsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertSavingsTransaction = z.infer<typeof insertSavingsTransactionSchema>;
export type SavingsTransaction = typeof savingsTransactionsTable.$inferSelect;

// ── Savings Goals ─────────────────────────────────────────────────────────────

export const savingsGoalsTable = pgTable("savings_goals", {
  userId: text("user_id").primaryKey(),
  goal: integer("goal").notNull().default(5000),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSavingsGoalSchema = createInsertSchema(savingsGoalsTable);

export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;
export type SavingsGoal = typeof savingsGoalsTable.$inferSelect;
