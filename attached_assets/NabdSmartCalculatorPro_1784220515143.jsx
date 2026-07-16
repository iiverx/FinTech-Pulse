import { useState } from "react";
import { Wallet, RotateCcw, TrendingUp, Home, PiggyBank, CircleDollarSign } from "lucide-react";

/**
 * الحاسبة المالية الذكية - نبض (نسخة احترافية)
 * إدخال نصي واحد يُستخرج منه الراتب والالتزامات وهدف الادخار عبر الذكاء
 * الاصطناعي، ويُحسب المبلغ الآمن للإنفاق اليومي محليًا بدقة رياضية.
 */

function remainingDaysInMonth() {
  const now = new Date();
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return totalDays - now.getDate() + 1;
}

function formatCurrency(n) {
  return new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(Math.round(n));
}

const SYSTEM_PROMPT = `أنت محرك استخراج بيانات مالية داخل حاسبة تطبيق "نبض". لا تتحدث كمساعد شات، فقط استخرج وحدّث البيانات.

لديك حالة مالية حالية (JSON) ممرّرة لك. مهمتك:
1. اقرأ إدخال المستخدم الجديد.
2. حدّث الحالة: الراتب (salary)، الالتزامات الثابتة (obligations: قائمة بها name وamount)، هدف الادخار الشهري (savingsGoal).
3. لا تحذف بيانات موجودة إلا إذا ذكر المستخدم تحديثًا صريحًا لنفس البند.
4. لا تحسب أنت أي مجموع أو مبلغ يومي.
5. اكتب note قصيرة جدًا (أقل من 8 كلمات) تصف ماذا فهمت من الإدخال، أو "لم أفهم بيانات مالية" إذا الإدخال غير متعلق.

أجب فقط بصيغة JSON التالية بدون أي نص إضافي وبدون Markdown:
{"note": "وصف قصير جدًا لما تم استخراجه", "state": {"salary": رقم أو null, "obligations": [{"name":"اسم","amount":رقم}], "savingsGoal": رقم أو null}}`;

export default function NabdSmartCalculatorPro() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState(null);
  const [error, setError] = useState(false);
  const [financialState, setFinancialState] = useState({
    salary: null,
    obligations: [],
    savingsGoal: null,
  });

  const days = remainingDaysInMonth();
  const totalObligations = financialState.obligations.reduce((sum, o) => sum + (o.amount || 0), 0);
  const hasData = financialState.salary != null;
  const available = hasData ? financialState.salary - totalObligations - (financialState.savingsGoal || 0) : null;
  const dailySafe = available != null && available > 0 ? available / days : null;
  const usagePercent =
    hasData && financialState.salary > 0
      ? Math.min(100, Math.round(((totalObligations + (financialState.savingsGoal || 0)) / financialState.salary) * 100)
        )
      : 0;

  async function handleCalculate() {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(false);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 800,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `الحالة الحالية: ${JSON.stringify(financialState)}\n\nالإدخال الجديد: ${text}`,
            },
          ],
        }),
      });

      const data = await response.json();
      const rawText = data.content?.map((b) => b.text || "").join("") || "{}";
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      setFinancialState((prev) => ({
        salary: parsed.state?.salary ?? prev.salary,
        obligations:
          parsed.state?.obligations && parsed.state.obligations.length > 0
            ? mergeObligations(prev.obligations, parsed.state.obligations)
            : prev.obligations,
        savingsGoal: parsed.state?.savingsGoal ?? prev.savingsGoal,
      }));
      setNote(parsed.note || null);
      setInput("");
    } catch (err) {
      setError(true);
      setNote("تعذّر فهم الإدخال، حاول صياغة مختلفة");
    } finally {
      setLoading(false);
    }
  }

  function mergeObligations(existing, incoming) {
    const map = new Map(existing.map((o) => [o.name, o.amount]));
    incoming.forEach((o) => map.set(o.name, o.amount));
    return Array.from(map, ([name, amount]) => ({ name, amount }));
  }

  function reset() {
    setFinancialState({ salary: null, obligations: [], savingsGoal: null });
    setInput("");
    setNote(null);
    setError(false);
  }

  return (
    <div dir="rtl" className="w-full max-w-md mx-auto bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* الرأس */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <CircleDollarSign className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 leading-none">الحاسبة المالية الذكية</p>
            <p className="text-[11px] text-gray-400 mt-1">نبض</p>
          </div>
        </div>
        <button
          onClick={reset}
          className="text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="إعادة تعيين"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* المبلغ الرئيسي */}
      <div className="px-5 pt-6 pb-5 text-center border-b border-gray-100">
        <p className="text-xs text-gray-500 mb-2 tracking-wide">المبلغ الآمن للإنفاق اليومي</p>
        <p className="text-4xl font-medium text-gray-900 tabular-nums">
          {dailySafe != null ? formatCurrency(dailySafe) : "٠"}
          <span className="text-base text-gray-400 mr-1.5">ريال</span>
        </p>
        <p className="text-[11px] text-gray-400 mt-2">
          محسوب على أساس {days} يوم متبقية من الشهر الحالي
        </p>
      </div>

      {/* شريط الاستخدام */}
      {hasData && (
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">نسبة الالتزامات والادخار من الراتب</span>
            <span className="text-xs font-medium text-gray-700 tabular-nums">{usagePercent}٪</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${usagePercent >= 90 ? "bg-red-400" : "bg-teal-500"}`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      )}

      {/* الملخص */}
      <div className="grid grid-cols-3 divide-x divide-x-reverse divide-gray-100 border-b border-gray-100">
        <SummaryItem icon={<TrendingUp className="w-3.5 h-3.5" />} label="الراتب" value={hasData ? formatCurrency(financialState.salary) : "—"} />
        <SummaryItem icon={<Home className="w-3.5 h-3.5" />} label="الالتزامات" value={formatCurrency(totalObligations)} />
        <SummaryItem icon={<PiggyBank className="w-3.5 h-3.5" />} label="الادخار" value={financialState.savingsGoal != null ? formatCurrency(financialState.savingsGoal) : "—"} />
      </div>

      {/* تفاصيل الالتزامات */}
      {financialState.obligations.length > 0 && (
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs text-gray-500 mb-2.5">تفاصيل الالتزامات</p>
          <div className="space-y-2">
            {financialState.obligations.map((o, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{o.name}</span>
                <span className="text-gray-900 font-medium tabular-nums">{formatCurrency(o.amount)} ريال</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ملاحظة الاستخراج */}
      <div className="px-5 pt-4 min-h-[20px]">
        {loading ? (
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            جارِ التحليل...
          </p>
        ) : note ? (
          <p className={`text-xs ${error ? "text-red-500" : "text-teal-700"}`}>{note}</p>
        ) : (
          <p className="text-xs text-gray-400">اكتب راتبك والتزاماتك وهدف الادخار بالأسفل</p>
        )}
      </div>

      {/* الإدخال */}
      <div className="p-5 pt-3 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
          placeholder="مثال: راتبي 8000 وقسط تعليم 1500"
          className="flex-1 h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
        />
        <button
          onClick={handleCalculate}
          disabled={loading || !input.trim()}
          className="h-10 px-5 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-30 hover:bg-gray-800 transition-colors"
        >
          احسب
        </button>
      </div>
    </div>
  );
}

function SummaryItem({ icon, label, value }) {
  return (
    <div className="px-3 py-3.5 text-center">
      <div className="flex items-center justify-center gap-1 text-gray-400 mb-1.5">{icon}</div>
      <p className="text-[10px] text-gray-500 mb-0.5">{label}</p>
      <p className="text-xs font-medium text-gray-900 tabular-nums truncate">{value}</p>
    </div>
  );
}
