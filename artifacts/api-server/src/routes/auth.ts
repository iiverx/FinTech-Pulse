import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const router: IRouter = Router();

// ── POST /api/auth/register ───────────────────────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const { name, email, password } = parsed.data;

  try {
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()));

    if (existing) {
      res.status(409).json({ error: "هذا البريد الإلكتروني مسجل بالفعل" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(usersTable)
      .values({ name, email: email.toLowerCase(), passwordHash })
      .returning({ id: usersTable.id, name: usersTable.name, email: usersTable.email });

    req.session.userId    = user!.id;
    req.session.userEmail = user!.email;
    req.session.userName  = user!.name;

    req.session.save((err) => {
      if (err) {
        res.status(500).json({ error: "Session save failed" });
        return;
      }
      res.status(201).json({ id: user!.id, name: user!.name, email: user!.email });
    });
  } catch {
    res.status(500).json({ error: "Registration failed" });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()));

    if (!user) {
      res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      return;
    }

    req.session.userId    = user.id;
    req.session.userEmail = user.email;
    req.session.userName  = user.name;

    req.session.save((err) => {
      if (err) {
        res.status(500).json({ error: "Session save failed" });
        return;
      }
      res.json({ id: user.id, name: user.name, email: user.email });
    });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sid");
    res.json({ ok: true });
  });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get("/auth/me", (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({
    id: req.session.userId,
    name: req.session.userName,
    email: req.session.userEmail,
  });
});

export default router;
