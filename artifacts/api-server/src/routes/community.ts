import { Router, type IRouter } from "express";
import { db, communityProfilesTable, incomeTable, financialPulseTable, usersTable } from "@workspace/db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

function getIncomeBracket(salary: number): string {
  if (salary < 5000) return "low";
  if (salary < 10000) return "medium";
  if (salary < 20000) return "high";
  return "very_high";
}

// ── GET /api/community/compare ────────────────────────────────────────────────
router.get("/community/compare", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  try {
    // Get user's income and latest pulse
    const [income] = await db.select().from(incomeTable).where(eq(incomeTable.userId, userId));
    const [latestPulse] = await db
      .select()
      .from(financialPulseTable)
      .where(eq(financialPulseTable.userId, userId))
      .orderBy(desc(financialPulseTable.createdAt))
      .limit(1);

    const userSalary = income?.monthlySalary ?? 0;
    const userScore = latestPulse?.score ?? null;
    const bracket = getIncomeBracket(userSalary);

    // Fetch community profiles for same income bracket
    const peers = await db
      .select()
      .from(communityProfilesTable)
      .where(eq(communityProfilesTable.incomeBracket, bracket));

    if (peers.length === 0) {
      return res.json({
        userScore,
        similarUsersAverage: null,
        top10PercentScore: null,
        percentile: null,
        incomeBracket: bracket,
        peerCount: 0,
        privacyNote: "لا توجد بيانات مجتمعية كافية للمقارنة حتى الآن.",
      });
    }

    const scores = peers.map(p => p.pulseScore).sort((a, b) => a - b);
    const avg = Math.round(scores.reduce((a, c) => a + c, 0) / scores.length);
    const top10idx = Math.floor(scores.length * 0.90);
    const top10Score = scores[top10idx] ?? scores[scores.length - 1] ?? 0;

    // User percentile
    let percentile: number | null = null;
    if (userScore !== null) {
      const below = scores.filter(s => s < userScore).length;
      percentile = Math.round((below / scores.length) * 100);
    }

    const bracketLabels: Record<string, string> = {
      low: "منخفض الدخل",
      medium: "متوسط الدخل",
      high: "مرتفع الدخل",
      very_high: "مرتفع الدخل جداً",
    };

    res.json({
      userScore,
      similarUsersAverage: avg,
      top10PercentScore: top10Score,
      percentile,
      incomeBracket: bracketLabels[bracket] ?? bracket,
      peerCount: peers.length,
      comparison:
        userScore === null
          ? "احسب نبضتك المالية أولاً للمقارنة مع المجتمع."
          : userScore > avg
          ? `أنت أفضل من المتوسط (${avg}) بـ${userScore - avg} نقطة. استمر!`
          : userScore < avg
          ? `متوسط المجتمع المشابه لك ${avg}. يمكنك تحسين وضعك بنقاط بسيطة.`
          : "أنت عند المتوسط تماماً.",
      privacyNote: "البيانات مجهولة الهوية تماماً. لا يتم مشاركة أي معلومات شخصية.",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch community comparison" });
  }
});

export default router;
