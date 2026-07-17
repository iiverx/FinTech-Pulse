import { Router, type IRouter } from "express";
import {
  db, notificationsTable, activityLogsTable,
  incomeTable, obligationsTable, budgetTable,
  transactionsTable, savingsTransactionsTable, financialPulseTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// ── GET /api/notifications ────────────────────────────────────────────────────
router.get("/notifications", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { unread } = req.query;
  try {
    const rows = await db
      .select().from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt)).limit(50);
    const filtered = unread === "true" ? rows.filter(r => !r.isRead) : rows;
    const unreadCount = rows.filter(r => !r.isRead).length;
    res.json({ notifications: filtered, unreadCount });
  } catch {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// ── PUT /api/notifications/read-all ── MUST be before /:id ───────────────────
router.put("/notifications/read-all", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  try {
    await db.update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.userId, userId));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

// ── POST /api/notifications/generate ── MUST be before /:id ──────────────────
router.post("/notifications/generate", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  try {
    const [income] = await db.select().from(incomeTable).where(eq(incomeTable.userId, userId));
    const obligations = await db.select().from(obligationsTable).where(eq(obligationsTable.userId, userId));
    const budgets = await db.select().from(budgetTable).where(eq(budgetTable.userId, userId));

    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

    const transactions = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, userId));
    const monthExpenses = transactions
      .filter(t => t.type === "expense" && t.transactionDate >= startOfMonth)
      .reduce((a, t) => a + t.amount, 0);

    const savingsTx = await db.select().from(savingsTransactionsTable).where(eq(savingsTransactionsTable.userId, userId));
    const totalSavings = savingsTx.reduce((a, t) => a + t.amount, 0);

    const [latestPulse] = await db
      .select().from(financialPulseTable)
      .where(eq(financialPulseTable.userId, userId))
      .orderBy(desc(financialPulseTable.createdAt)).limit(1);

    const totalIncome = (income?.monthlySalary ?? 0) + (income?.extraIncomeAmount ?? 0);
    const totalObligations = obligations.reduce((a, o) => a + o.amount, 0);
    const spendRatio = totalIncome > 0 ? monthExpenses / totalIncome : 0;
    const oblRatio   = totalIncome > 0 ? totalObligations / totalIncome : 0;
    const savingRate = totalIncome > 0 ? totalSavings / totalIncome : 0;
    const score      = latestPulse?.score ?? 70;

    type NType = "info" | "warning" | "alert" | "success";
    const toInsert: { title: string; message: string; type: NType }[] = [];

    if (spendRatio > 0.6)
      toInsert.push({ title: "⚠️ إنفاق مرتفع", message: `أنفقت ${Math.round(spendRatio * 100)}% من دخلك هذا الشهر — حاول تقليل المصاريف غير الضرورية.`, type: "warning" });
    else if (spendRatio > 0)
      toInsert.push({ title: "✅ إنفاق سليم", message: `نسبة إنفاقك ${Math.round(spendRatio * 100)}% من الدخل — أنت في النطاق الآمن.`, type: "success" });

    if (oblRatio > 0.4)
      toInsert.push({ title: "🔴 التزامات مرتفعة", message: `التزاماتك تمثّل ${Math.round(oblRatio * 100)}% من دخلك. تجنّب أي قروض جديدة حالياً.`, type: "alert" });

    if (savingRate < 0.1 && totalIncome > 0)
      toInsert.push({ title: "💡 زيادة الادخار", message: `نسبة ادخارك أقل من 10%. حاول إضافة ${Math.round(totalIncome * 0.1)} ر.س شهرياً لتحسين مؤشرك.`, type: "info" });
    else if (savingRate >= 0.2)
      toInsert.push({ title: "🏆 ادخار ممتاز!", message: `أنت تدخر أكثر من 20% من دخلك — مستوى مالي متقدم.`, type: "success" });

    const overBudget = budgets.filter(b => b.currentSpending > b.monthlyLimit);
    if (overBudget.length > 0)
      toInsert.push({ title: "📊 تجاوز الميزانية", message: `تجاوزت ميزانية: ${overBudget.map(b => b.category).join("، ")}. راجع إنفاقك في هذه الفئات.`, type: "warning" });

    if (score >= 80)
      toInsert.push({ title: "⭐ مؤشر ممتاز", message: `نبضتك المالية ${score}/100 — أنت ضمن أفضل 20% من المستخدمين!`, type: "success" });
    else if (score < 60)
      toInsert.push({ title: "📉 تحسين مطلوب", message: `نبضتك ${score}/100. راجع قسم المساعد الذكي للحصول على توصيات شخصية.`, type: "alert" });

    toInsert.push({ title: "🔔 تذكير أسبوعي", message: "راجع ميزانيتك الأسبوعية وتأكد من سير ادخارك بالمسار الصحيح.", type: "info" });

    if (toInsert.length > 0) {
      await db.insert(notificationsTable).values(toInsert.map(n => ({ userId, ...n })));
    }

    const all = await db.select().from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt)).limit(50);

    res.json({ notifications: all, generated: toInsert.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to generate notifications" });
  }
});

// ── PUT /api/notifications/:id/read ──────────────────────────────────────────
router.put("/notifications/:id/read", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { id } = req.params;
  try {
    const [row] = await db.update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Notification not found" }); return; }
    await db.insert(activityLogsTable).values({
      userId, action: "read_notification", description: `قرأ إشعاراً: ${row.title}`,
    }).catch(() => {});
    res.json(row);
  } catch {
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

// ── DELETE /api/notifications/:id ─────────────────────────────────────────────
router.delete("/notifications/:id", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { id } = req.params;
  try {
    await db.delete(notificationsTable)
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

export default router;
