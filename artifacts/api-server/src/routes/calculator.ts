import { Router } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

const SYSTEM_PROMPT = `أنت محرك استخراج بيانات مالية داخل حاسبة تطبيق "نبض". لا تتحدث كمساعد شات، فقط استخرج وحدّث البيانات.

لديك حالة مالية حالية (JSON) ممرّرة لك. مهمتك:
1. اقرأ إدخال المستخدم الجديد.
2. حدّث الحالة: الراتب (salary)، الالتزامات الثابتة (obligations: قائمة بها name وamount)، هدف الادخار الشهري (savingsGoal).
3. لا تحذف بيانات موجودة إلا إذا ذكر المستخدم تحديثًا صريحًا لنفس البند.
4. لا تحسب أنت أي مجموع أو مبلغ يومي.
5. اكتب note قصيرة جدًا (أقل من 8 كلمات) تصف ماذا فهمت من الإدخال، أو "لم أفهم بيانات مالية" إذا الإدخال غير متعلق.

أجب فقط بصيغة JSON التالية بدون أي نص إضافي وبدون Markdown:
{"note": "وصف قصير جدًا لما تم استخراجه", "state": {"salary": رقم أو null, "obligations": [{"name":"اسم","amount":رقم}], "savingsGoal": رقم أو null}}`;

router.post("/extract", async (req, res) => {
  const { currentState, input } = req.body as {
    currentState: unknown;
    input: string;
  };

  if (!input?.trim()) {
    return res.status(400).json({ error: "input مطلوب" });
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `الحالة الحالية: ${JSON.stringify(currentState)}\n\nالإدخال الجديد: ${input}`,
        },
      ],
    });

    const rawText = message.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    const parsed = JSON.parse(rawText);
    return res.json(parsed);
  } catch (err) {
    console.error("Calculator extract error:", err);
    return res.status(500).json({ error: "فشل التحليل" });
  }
});

export default router;
