import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// ── GET /api/users/me ─────────────────────────────────────────────────────────
router.get("/users/me", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  try {
    const [user] = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        phone: usersTable.phone,
        city: usersTable.city,
        age: usersTable.age,
        maritalStatus: usersTable.maritalStatus,
        housingType: usersTable.housingType,
        dependentsCount: usersTable.dependentsCount,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId));

    if (!user) { res.status(404).json({ error: "User not found" }); return; }
    res.json(user);
  } catch {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// ── PUT /api/users/me ─────────────────────────────────────────────────────────
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  age: z.number().int().min(0).max(120).optional(),
  maritalStatus: z.string().optional(),
  housingType: z.string().optional(),
  dependentsCount: z.number().int().min(0).optional(),
});

router.put("/users/me", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  try {
    const [updated] = await db
      .update(usersTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(usersTable.id, userId))
      .returning({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        phone: usersTable.phone,
        city: usersTable.city,
        age: usersTable.age,
        maritalStatus: usersTable.maritalStatus,
        housingType: usersTable.housingType,
        dependentsCount: usersTable.dependentsCount,
      });
    if (!updated) { res.status(404).json({ error: "User not found" }); return; }
    // Update session
    if (parsed.data.name) req.session.userName = parsed.data.name;
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to update user" });
  }
});

// ── DELETE /api/users/me ──────────────────────────────────────────────────────
router.delete("/users/me", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  try {
    await db.delete(usersTable).where(eq(usersTable.id, userId));
    req.session.destroy(() => {
      res.clearCookie("sid");
      res.json({ ok: true, message: "Account deleted" });
    });
  } catch {
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;
