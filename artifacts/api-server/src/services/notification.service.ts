import { db, notificationsTable } from "@workspace/db";

interface NotifyInput {
  userId: string;
  title: string;
  message: string;
  type?: "info" | "warning" | "alert" | "success";
}

export async function createNotification(input: NotifyInput): Promise<void> {
  await db.insert(notificationsTable).values({
    userId: input.userId,
    title: input.title,
    message: input.message,
    type: input.type ?? "info",
  });
}

/** Auto-generate smart notifications based on financial conditions */
export async function generateSmartNotifications(params: {
  userId: string;
  monthlySalary: number;
  spentSoFar: number;
  budgetCategories: { category: string; limit: number; spent: number }[];
  goalsProgress: { goalType: string; target: number; current: number }[];
  totalObligations: number;
  daysUntilObligationDue: number;
  savingsRate: number;
}): Promise<void> {
  const notifications: NotifyInput[] = [];
  const totalIncome = params.monthlySalary;
  const spendingRatio = totalIncome > 0 ? params.spentSoFar / totalIncome : 0;

  // Spending alerts
  if (spendingRatio >= 0.85) {
    notifications.push({
      userId: params.userId,
      title: "تحذير: إنفاق مرتفع",
      message: `لقد أنفقت ${Math.round(spendingRatio * 100)}% من دخلك الشهري. راجع إنفاقك.`,
      type: "alert",
    });
  }

  // Budget category alerts
  for (const b of params.budgetCategories) {
    const ratio = b.limit > 0 ? b.spent / b.limit : 0;
    if (ratio >= 0.90 && ratio < 1) {
      notifications.push({
        userId: params.userId,
        title: `اقتربت من حد ميزانية ${b.category}`,
        message: `أنفقت ${Math.round(ratio * 100)}% من ميزانية ${b.category}. تبقى ${b.limit - b.spent} ر.س.`,
        type: "warning",
      });
    } else if (ratio >= 1) {
      notifications.push({
        userId: params.userId,
        title: `تجاوزت ميزانية ${b.category}`,
        message: `تجاوزت الحد المحدد لفئة ${b.category}. حاول ترشيد الإنفاق.`,
        type: "alert",
      });
    }
  }

  // Obligations approaching
  if (params.daysUntilObligationDue <= 5 && params.totalObligations > 0) {
    notifications.push({
      userId: params.userId,
      title: "موعد التزام مالي قريب",
      message: `لديك التزام مالي بقيمة ${params.totalObligations} ر.س خلال ${params.daysUntilObligationDue} أيام.`,
      type: "warning",
    });
  }

  // Savings opportunity
  const availableToSave = totalIncome - params.spentSoFar - params.totalObligations;
  if (availableToSave > 200 && params.savingsRate < 0.10) {
    notifications.push({
      userId: params.userId,
      title: "فرصة للادخار",
      message: `يمكنك ادخار ${Math.round(availableToSave)} ر.س إضافية هذا الشهر!`,
      type: "success",
    });
  }

  // Goals progress
  for (const g of params.goalsProgress) {
    const progress = g.target > 0 ? g.current / g.target : 0;
    if (progress >= 0.5 && progress < 0.6) {
      notifications.push({
        userId: params.userId,
        title: `وصلت لنصف هدف ${g.goalType}`,
        message: `أنت في منتصف الطريق! وصلت لـ ${g.current} ر.س من ${g.target} ر.س.`,
        type: "success",
      });
    }
  }

  // Insert all
  for (const n of notifications) {
    await createNotification(n).catch(() => {/* silent */});
  }
}
