import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, savingsTransactionsTable, savingsGoalsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const router: IRouter = Router();

// ── Auth guard middleware ──────────────────────────────────────────────────────
function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

// ── GET /api/savings/transactions ─────────────────────────────────────────────
router.get("/savings/transactions", requireAuth, async (req, res) => {
  const userId = req.session.userId!;

  try {
    const rows = await db
      .select()
      .from(savingsTransactionsTable)
      .where(eq(savingsTransactionsTable.userId, userId))
      .orderBy(desc(savingsTransactionsTable.date));

    res.json({
      transactions: rows.map((r) => ({
        id: r.id,
        amount: r.amount,
        date: r.date.toISOString(),
        note: r.note ?? undefined,
      })),
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// ── POST /api/savings/transactions ────────────────────────────────────────────
const createTransactionSchema = z.object({
  amount: z.number().positive(),
  note: z.string().optional(),
  date: z.string().optional(),
});

router.post("/savings/transactions", requireAuth, async (req, res) => {
  const userId = req.session.userId!;

  const parsed = createTransactionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }

  const { amount, note, date } = parsed.data;

  try {
    const [row] = await db
      .insert(savingsTransactionsTable)
      .values({
        userId,
        amount,
        note: note ?? null,
        date: date ? new Date(date) : new Date(),
      })
      .returning();

    res.status(201).json({
      id: row!.id,
      amount: row!.amount,
      date: row!.date.toISOString(),
      note: row!.note ?? undefined,
    });
  } catch {
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

// ── GET /api/savings/goal ─────────────────────────────────────────────────────
router.get("/savings/goal", requireAuth, async (req, res) => {
  const userId = req.session.userId!;

  try {
    const [row] = await db
      .select()
      .from(savingsGoalsTable)
      .where(eq(savingsGoalsTable.userId, userId));

    res.json({ goal: row?.goal ?? 5000 });
  } catch {
    res.status(500).json({ error: "Failed to fetch goal" });
  }
});

// ── PUT /api/savings/goal ─────────────────────────────────────────────────────
const updateGoalSchema = z.object({
  goal: z.number().nonnegative(),
});

router.put("/savings/goal", requireAuth, async (req, res) => {
  const userId = req.session.userId!;

  const parsed = updateGoalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }

  const { goal } = parsed.data;

  try {
    await db
      .insert(savingsGoalsTable)
      .values({ userId, goal, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: savingsGoalsTable.userId,
        set: { goal, updatedAt: new Date() },
      });

    res.json({ goal });
  } catch {
    res.status(500).json({ error: "Failed to update goal" });
  }
});

// ── DELETE /api/savings/transactions ─────────────────────────────────────────
router.delete("/savings/transactions", requireAuth, async (req, res) => {
  const userId = req.session.userId!;

  try {
    await db
      .delete(savingsTransactionsTable)
      .where(eq(savingsTransactionsTable.userId, userId));

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete transactions" });
  }
});

export default router;
