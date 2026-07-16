import { Router, type IRouter } from "express";
import { db, transactionsTable, financialPulseTable, goalsTable, obligationsTable } from "@workspace/db";
import { eq, desc, gte, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// ── GET /api/reports/spending-by-category ─────────────────────────────────────
router.get("/reports/spending-by-category", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { month } = req.query as { month?: string };
  try {
    const now = new Date();
    const start = month
      ? new Date(`${month}-01`)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const rows = await db
      .select()
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.userId, userId),
          eq(transactionsTable.type, "expense"),
          gte(transactionsTable.transactionDate, start),
        )
      );

    // Group by category
    const grouped: Record<string, number> = {};
    for (const r of rows) {
      if (r.transactionDate < end) {
        grouped[r.category] = (grouped[r.category] ?? 0) + r.amount;
      }
    }

    const total = Object.values(grouped).reduce((a, c) => a + c, 0);
    const data = Object.entries(grouped)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    res.json({ data, total, period: start.toISOString().slice(0, 7) });
  } catch {
    res.status(500).json({ error: "Failed to generate spending by category report" });
  }
});

// ── GET /api/reports/weekly-spending ─────────────────────────────────────────
router.get("/reports/weekly-spending", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  try {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const rows = await db
      .select()
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.userId, userId),
          eq(transactionsTable.type, "expense"),
          gte(transactionsTable.transactionDate, since),
        )
      );

    // Group by day
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toISOString().slice(0, 10)] = 0;
    }
    for (const r of rows) {
      const key = r.transactionDate.toISOString().slice(0, 10);
      if (key in days) days[key] = (days[key] ?? 0) + r.amount;
    }

    const data = Object.entries(days).map(([date, amount]) => ({ date, amount }));
    res.json({ data });
  } catch {
    res.status(500).json({ error: "Failed to generate weekly spending report" });
  }
});

// ── GET /api/reports/pulse-trend ──────────────────────────────────────────────
router.get("/reports/pulse-trend", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  try {
    const since = new Date();
    since.setDate(since.getDate() - 29);

    const rows = await db
      .select()
      .from(financialPulseTable)
      .where(eq(financialPulseTable.userId, userId))
      .orderBy(desc(financialPulseTable.createdAt))
      .limit(30);

    const data = rows.map(r => ({
      date: r.createdAt.toISOString().slice(0, 10),
      score: r.score,
      status: r.status,
    })).reverse();

    res.json({ data });
  } catch {
    res.status(500).json({ error: "Failed to generate pulse trend report" });
  }
});

// ── GET /api/reports/income-vs-expense ───────────────────────────────────────
router.get("/reports/income-vs-expense", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { months = "6" } = req.query as { months?: string };
  try {
    const since = new Date();
    since.setMonth(since.getMonth() - parseInt(months));
    since.setDate(1); since.setHours(0, 0, 0, 0);

    const rows = await db
      .select()
      .from(transactionsTable)
      .where(and(eq(transactionsTable.userId, userId), gte(transactionsTable.transactionDate, since)));

    // Group by month
    const byMonth: Record<string, { income: number; expense: number }> = {};
    for (const r of rows) {
      const key = r.transactionDate.toISOString().slice(0, 7);
      if (!byMonth[key]) byMonth[key] = { income: 0, expense: 0 };
      if (r.type === "income") byMonth[key].income += r.amount;
      else byMonth[key].expense += r.amount;
    }

    const data = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v, net: v.income - v.expense }));

    res.json({ data });
  } catch {
    res.status(500).json({ error: "Failed to generate income vs expense report" });
  }
});

// ── GET /api/reports/goals-progress ──────────────────────────────────────────
router.get("/reports/goals-progress", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  try {
    const rows = await db.select().from(goalsTable).where(eq(goalsTable.userId, userId));
    const data = rows.map(g => ({
      id: g.id,
      goalType: g.goalType,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      progressPercent: g.targetAmount > 0
        ? Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100)
        : 0,
      deadline: g.deadline?.toISOString(),
      monthlyRequiredAmount: g.monthlyRequiredAmount,
    }));
    res.json({ data });
  } catch {
    res.status(500).json({ error: "Failed to generate goals progress report" });
  }
});

// ── GET /api/reports/upcoming-obligations ────────────────────────────────────
router.get("/reports/upcoming-obligations", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  try {
    const rows = await db.select().from(obligationsTable).where(eq(obligationsTable.userId, userId));
    const today = new Date().getDate();
    const data = rows
      .map(o => ({
        ...o,
        daysUntilDue: o.dueDate
          ? (o.dueDate >= today ? o.dueDate - today : 30 - today + o.dueDate)
          : null,
      }))
      .sort((a, b) => (a.daysUntilDue ?? 99) - (b.daysUntilDue ?? 99));
    res.json({ data });
  } catch {
    res.status(500).json({ error: "Failed to fetch upcoming obligations" });
  }
});

export default router;
