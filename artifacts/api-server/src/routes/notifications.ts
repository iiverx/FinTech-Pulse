import { Router, type IRouter } from "express";
import { db, notificationsTable, activityLogsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// ── GET /api/notifications ────────────────────────────────────────────────────
router.get("/notifications", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { unread } = req.query;
  try {
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);

    const filtered = unread === "true" ? rows.filter(r => !r.isRead) : rows;
    const unreadCount = rows.filter(r => !r.isRead).length;

    res.json({ notifications: filtered, unreadCount });
  } catch {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// ── PUT /api/notifications/:id/read ──────────────────────────────────────────
router.put("/notifications/:id/read", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const { id } = req.params;
  try {
    const [row] = await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)))
      .returning();
    if (!row) { res.status(404).json({ error: "Notification not found" }); return; }

    // Activity log
    await db.insert(activityLogsTable).values({
      userId,
      action: "read_notification",
      description: `قرأ إشعاراً: ${row.title}`,
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
