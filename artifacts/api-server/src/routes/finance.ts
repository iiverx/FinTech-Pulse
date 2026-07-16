import { Router, type IRouter } from "express";
import { db, incomeTable, obligationsTable, budgetTable, goalsTable, savingsTransactionsTable, savingsGoalsTable } from "@workspace/db";
import { eq, and, sum } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth";
import { calculateSafeDailySpending } from "../services/safe-spending.service";

const router: IRouter = Router();

// ─────────────────────────────────────────────────────────────────────────────
// INCOME
// ─────────────────────────────────────────────────────────────────────────────

const incomeSchema = z.object({
  monthlySalary: z.number().nonnegative(),
  salaryDay: z.number().int().min(1).max(31).default(1),
  hasExtraIncome: z.boolean().default(false),
  extraIncomeAmount: z.number().nonnegative().default(0),
});

router.post("/finance/income", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const parsed = incomeSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data", details: parsed.error.issues }); return; }
  try {
    const [row] = await db
      .insert(incomeTable)
      .values({ userId, ...parsed.data })
      .onConflictDoUpdate({ target: incomeTable.userId, set: { ...parsed.data, updatedAt: new Date() } })
      .returning();
    res.status(201).json(row);
  } catch {
    res.status(500).json({ error: "Failed to save income" });
  }
});

router.get("/finance/income", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  try {
    const [row] = await db.select().from(incomeTable).where(eq(incomeTable.userId, userId));
    res.json(row ?? { monthlySalary: 0, salaryDay: 1, hasExtraIncome: false, extraIncomeAmount: 0 });
  } catch {
    res.status(500).json({ error: "Failed to fetch income" });
  }
});

router.put("/finance/income", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const parsed = incomeSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data", details: parsed.error.issues }); return; }
  try {
    const [row] = await db
      .update(incomeTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(incomeTable.userId, userId))
      .returning();
    if (!row) { res.status(404).json({ error: "Income record not found" }); return; }
    res.json(row);
  } catch {
    res.status(500).json({ error: "Failed to update income" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// OBLIGATIONS
// ─────────────────────────────────────────────────────────────────────────────

const obligationSchema = z.object({
  type: z.string().min(1),
  amount: z.number().positive(),
  dueDate: z.number().int().min(1).max(31).optional(),
  isRecurring: z.boolean().default(true),
});

router.post("/finance/obligations", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const parsed = obligationSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data", details: parsed.error.issues }); return; }
  try {
    const [row] = await db.insert(obligationsTable).values({ userId, ...parsed.data }).returning();
    res.status(201).json(row);
  } catch {
    res.status(500).json({ error: "Failed to save obligation" });
  }
});

router.get("/finance/obligations", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  try {
    const rows = await db.select().from(obligationsTable).where(eq(obligationsTable.userId, userId));
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch obligations" });
  }
});

router.put("/finance/obligations/:id", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { id } = req.params;
  const parsed = obligationSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data", details: parsed.error.issues }); return; }
  try {
    const [row] = await db
      .update(obligationsTable)
      .set(parsed.data)
      .where(and(eq(obligationsTable.id, id), eq(obligationsTable.userId, userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch {
    res.status(500).json({ error: "Failed to update obligation" });
  }
});

router.delete("/finance/obligations/:id", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { id } = req.params;
  try {
    await db.delete(obligationsTable).where(and(eq(obligationsTable.id, id), eq(obligationsTable.userId, userId)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete obligation" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// BUDGET
// ─────────────────────────────────────────────────────────────────────────────

const budgetSchema = z.object({
  category: z.string().min(1),
  monthlyLimit: z.number().positive(),
  currentSpending: z.number().nonnegative().default(0),
});

router.post("/finance/budget", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const parsed = budgetSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data", details: parsed.error.issues }); return; }
  try {
    const [row] = await db.insert(budgetTable).values({ userId, ...parsed.data }).returning();
    res.status(201).json(row);
  } catch {
    res.status(500).json({ error: "Failed to save budget" });
  }
});

router.get("/finance/budget", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  try {
    const rows = await db.select().from(budgetTable).where(eq(budgetTable.userId, userId));
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch budget" });
  }
});

router.put("/finance/budget/:id", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { id } = req.params;
  const parsed = budgetSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data", details: parsed.error.issues }); return; }
  try {
    const [row] = await db
      .update(budgetTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(budgetTable.id, id), eq(budgetTable.userId, userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch {
    res.status(500).json({ error: "Failed to update budget" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GOALS
// ─────────────────────────────────────────────────────────────────────────────

const goalSchema = z.object({
  goalType: z.string().min(1),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative().default(0),
  deadline: z.string().datetime().optional(),
  monthlyRequiredAmount: z.number().nonnegative().optional(),
});

router.post("/finance/goals", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const parsed = goalSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data", details: parsed.error.issues }); return; }
  try {
    const { deadline, ...rest } = parsed.data;
    const [row] = await db
      .insert(goalsTable)
      .values({ userId, ...rest, deadline: deadline ? new Date(deadline) : null })
      .returning();
    res.status(201).json(row);
  } catch {
    res.status(500).json({ error: "Failed to save goal" });
  }
});

router.get("/finance/goals", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  try {
    const rows = await db.select().from(goalsTable).where(eq(goalsTable.userId, userId));
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

router.put("/finance/goals/:id", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { id } = req.params;
  const parsed = goalSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data", details: parsed.error.issues }); return; }
  try {
    const { deadline, ...rest } = parsed.data;
    const [row] = await db
      .update(goalsTable)
      .set({ ...rest, ...(deadline !== undefined ? { deadline: new Date(deadline) } : {}) })
      .where(and(eq(goalsTable.id, id), eq(goalsTable.userId, userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(row);
  } catch {
    res.status(500).json({ error: "Failed to update goal" });
  }
});

router.delete("/finance/goals/:id", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { id } = req.params;
  try {
    await db.delete(goalsTable).where(and(eq(goalsTable.id, id), eq(goalsTable.userId, userId)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// SAFE DAILY SPENDING
// ─────────────────────────────────────────────────────────────────────────────

router.get("/finance/safe-daily-spending", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  try {
    const [incomeRow] = await db.select().from(incomeTable).where(eq(incomeTable.userId, userId));
    const obligations = await db.select().from(obligationsTable).where(eq(obligationsTable.userId, userId));
    const [savingsGoal] = await db.select().from(savingsGoalsTable).where(eq(savingsGoalsTable.userId, userId));

    // Compute this month's expenses from savings transactions (reuse existing table)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const savingsTxRows = await db
      .select()
      .from(savingsTransactionsTable)
      .where(eq(savingsTransactionsTable.userId, userId));
    const spentSoFar = savingsTxRows
      .filter(t => t.date >= startOfMonth)
      .reduce((acc, t) => acc + t.amount, 0);

    const totalObligations = obligations.reduce((a, o) => a + o.amount, 0);

    const result = calculateSafeDailySpending({
      monthlySalary: incomeRow?.monthlySalary ?? 0,
      extraIncome: incomeRow?.extraIncomeAmount ?? 0,
      totalObligations,
      monthlySavingsGoal: savingsGoal?.goal ?? 0,
      spentSoFar,
      salaryDay: incomeRow?.salaryDay ?? 1,
    });

    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to calculate safe daily spending" });
  }
});

export default router;
