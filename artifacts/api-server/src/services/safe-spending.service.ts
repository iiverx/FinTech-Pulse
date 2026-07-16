/**
 * Safe Daily Spending Calculator
 *
 * Computes how much the user can safely spend per day for the rest of the month.
 */

export interface SafeSpendingInput {
  monthlySalary: number;
  extraIncome: number;
  totalObligations: number;    // sum of all recurring obligations
  monthlySavingsGoal: number;  // target to save this month
  spentSoFar: number;          // expenses already incurred this month
  salaryDay: number;           // which day of month salary arrives
}

export interface SafeSpendingResult {
  safeDailySpending: number;
  availableBalance: number;
  remainingDays: number;
  warning: string | null;
  explanation: string;
}

export function calculateSafeDailySpending(input: SafeSpendingInput): SafeSpendingResult {
  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  // Days until next salary
  let remainingDays: number;
  if (currentDay < input.salaryDay) {
    remainingDays = input.salaryDay - currentDay;
  } else {
    // Salary already received this month; count until next month's salary day
    remainingDays = daysInMonth - currentDay + input.salaryDay;
  }
  remainingDays = Math.max(remainingDays, 1);

  const totalIncome = input.monthlySalary + input.extraIncome;
  const reservedAmount = input.totalObligations + input.monthlySavingsGoal;
  const availableForSpending = totalIncome - reservedAmount - input.spentSoFar;
  const safeDailySpending = Math.max(0, availableForSpending / remainingDays);

  let warning: string | null = null;
  if (availableForSpending < 0) {
    warning = "لقد تجاوزت الميزانية المتاحة بعد خصم الالتزامات وهدف الادخار";
  } else if (safeDailySpending < 50) {
    warning = "الرصيد المتاح منخفض. احرص على تقليل الإنفاق غير الضروري";
  }

  const explanation = availableForSpending <= 0
    ? `بعد خصم الالتزامات (${input.totalObligations} ر.س) وهدف الادخار (${input.monthlySavingsGoal} ر.س) والإنفاق المسجل (${input.spentSoFar} ر.س)، لا يوجد رصيد كافٍ للإنفاق اليومي.`
    : `يمكنك إنفاق ${Math.round(safeDailySpending)} ر.س يومياً خلال الـ ${remainingDays} يوماً القادمة بعد احتساب التزاماتك وهدف ادخارك.`;

  return {
    safeDailySpending: Math.round(safeDailySpending),
    availableBalance: Math.round(availableForSpending),
    remainingDays,
    warning,
    explanation,
  };
}
