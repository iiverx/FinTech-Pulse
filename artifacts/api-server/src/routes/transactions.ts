import { Router, type IRouter } from "express";
import { db, transactionsTable, activityLogsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

const CATEGORIES = [
  "طعام ومطاعم", "مواصلات", "تسوق", "ترفيه",
  "فواتير", "صحة", "تعليم", "اشتراكات", "التزامات", "أخرى",
];

const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().optional(),
  transactionDate: z.string().datetime().optional(),
  paymentMethod: z.string().optional(),
  source: z.string().optional(),
});

// ── POST /api/transactions ────────────────────────────────────────────────────
router.post("/transactions", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const parsed = transactionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid data", details: parsed.error.issues });
    return;
  }
  try {
    const { transactionDate, ...rest } = parsed.data;
    const [row] = await db
      .insert(transactionsTable)
      .values({
        userId,
        ...rest,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      })
      .returning();

    // Activity log
    await db.insert(activityLogsTable).values({
      userId,
      action: "add_transaction",
      description: `أضاف معاملة: ${row!.type === "income" ? "دخل" : "مصروف"} - ${row!.amount} ر.س`,
    }).catch(() => {});

    res.status(201).json(row);
  } catch {
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

// ── GET /api/transactions ─────────────────────────────────────────────────────
router.get("/transactions", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { type, category, limit = "50", offset = "0" } = req.query as Record<string, string>;

  try {
    const rows = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.userId, userId))
      .orderBy(desc(transactionsTable.transactionDate))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    const filtered = rows
      .filter(r => !type || r.type === type)
      .filter(r => !category || r.category === category);

    res.json({ transactions: filtered, total: filtered.length });
  } catch {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// ── GET /api/transactions/:id ─────────────────────────────────────────────────
router.get("/transactions/:id", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { id } = req.params;
  try {
    const [row] = await db
      .select()
      .from(transactionsTable)
      .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)));
    if (!row) { res.status(404).json({ error: "Transaction not found" }); return; }
    res.json(row);
  } catch {
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
});

// ── PUT /api/transactions/:id ─────────────────────────────────────────────────
router.put("/transactions/:id", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { id } = req.params;
  const parsed = transactionSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid data", details: parsed.error.issues }); return; }
  try {
    const { transactionDate, ...rest } = parsed.data;
    const [row] = await db
      .update(transactionsTable)
      .set({ ...rest, ...(transactionDate ? { transactionDate: new Date(transactionDate) } : {}) })
      .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Transaction not found" }); return; }
    res.json(row);
  } catch {
    res.status(500).json({ error: "Failed to update transaction" });
  }
});

// ── DELETE /api/transactions/:id ──────────────────────────────────────────────
router.delete("/transactions/:id", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { id } = req.params;
  try {
    await db.delete(transactionsTable).where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

export default router;
