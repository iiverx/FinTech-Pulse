"""
========================================================================
 نبض (Nabdh) - النموذج الكامل (Pipeline موحّد)
 مشروع هاكاثون أعمد 2026 - مسار تجربة العميل (Al Inma Bank x Tuwaiq)
========================================================================

طريقة التشغيل:
    python3 nabdh_pipeline.py

المدخلات المطلوبة:
    data/Nabd_12_Months_Clean01.csv
    (أعمدة: User_ID, Month, Monthly_Income, Housing, Food, Transport,
     Entertainment, Savings, Loans, Subscriptions, Remaining_Balance)

المخرجات:
    output/Nabdh_Final_Scored.csv   -> النتيجة النهائية لكل مستخدم
    output/Validation_Report.csv    -> نتائج اختبار حالات التحقق اليدوية

========================================================================
 منهجية النموذج (Methodology) - بإيجاز
========================================================================
1) لكل شهر، نحوّل المبالغ الخام لنسب من الدخل (Savings_Ratio, Debt_Ratio...)
2) نقيّم كل نسبة بدالة 0-100 مبنية على معايير مالية عالمية معروفة:
      - الادخار المثالي: 20%+ من الدخل (قاعدة 50/30/20)
      - نسبة الدين الآمنة (DTI): لا تتجاوز 36%
      - نسبة السكن الآمنة: لا تتجاوز 30%
3) نلخّص كل مستخدم عبر 12 شهر بثلاث طبقات:
      - المستوى العام (متوسط كل Score)
      - الاتجاه (Trend): هل وضعه يتحسن أو يسوء؟
      - الاستقرار (Volatility): هل وضعه ثابت أو متذبذب؟
4) نجمع كل هذا بأوزان (معايرة جزئيًا بالارتباط الإحصائي مع الواقع الفعلي)
5) نطبّق "سقفين" (Caps) لا يمكن تجاوزهما بغض النظر عن باقي العوامل:
      - سقف العجز المالي الفعلي (Remaining_Balance سالب)
      - سقف نسبة الدين الخطرة (DTI > 36%)
   هذا يمنع النموذج من "تعويض" مخاطرة حقيقية بعوامل زينة ثانية.
========================================================================
"""

import pandas as pd
import numpy as np
import os

INPUT_PATH  = "data/Nabd_12_Months_Clean01.csv"
OUTPUT_DIR  = "output"
MONTH_ORDER = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

WEIGHTS = {
    "Score_Savings":    0.15,
    "Score_Debt":       0.20,
    "Score_Housing":    0.10,
    "Score_Balance":    0.30,
    "Score_Trend":      0.15,
    "Score_Volatility": 0.10,
}


# ========================================================================
# دوال التقييم المالي (0-100) - كل دالة مبنية على معيار مالي معروف
# ========================================================================

def score_savings(r):
    """قاعدة 50/30/20: الادخار المثالي 20%+ من الدخل"""
    if r >= 0.20: return 100
    if r <= 0: return 0
    return (r / 0.20) * 100

def score_debt(r):
    """نسبة الدين للدخل (DTI) - المعيار العالمي: لا تتجاوز 36%"""
    if r <= 0.10: return 100
    if r >= 0.36: return 0
    return 100 - ((r - 0.10) / 0.26) * 100

def score_housing(r):
    """نسبة السكن للدخل - المعيار العالمي: لا تتجاوز 30%"""
    if r <= 0.30: return 100
    if r >= 0.50: return 0
    return 100 - ((r - 0.30) / 0.20) * 100

def score_balance(r):
    """نسبة الرصيد المتبقي من الدخل"""
    if r <= -0.10: return 0
    if r >= 0.15: return 100
    return ((r + 0.10) / 0.25) * 100

def score_trend(slope):
    """ميل خط الانحدار لنسبة الرصيد عبر 12 شهر: تحسّن أو تدهور"""
    lower, upper = -0.006, 0.003
    if slope >= upper: return 100
    if slope <= lower: return 0
    return ((slope - lower) / (upper - lower)) * 100

def score_volatility(vol):
    """تذبذب الرصيد المتبقي عبر الأشهر: كلما قل، زاد الاستقرار"""
    low, high = 0.003, 0.02
    if vol <= low: return 100
    if vol >= high: return 0
    return 100 - ((vol - low) / (high - low)) * 100

def deficit_cap(balance_ratio):
    """سقف صارم: عجز مالي فعلي لا يمكن تعويضه بعوامل ثانية"""
    if balance_ratio >= 0: return 100
    severity = min(abs(balance_ratio) / 0.10, 1.0)
    return 65 - severity * 30

def debt_cap(debt_ratio):
    """سقف صارم: دين خطر (DTI > 36%) لا يمكن تعويضه بعوامل ثانية"""
    if debt_ratio <= 0.36: return 100
    severity = min((debt_ratio - 0.36) / 0.20, 1.0)
    return 75 - severity * 45

def trend_slope(values):
    x = np.arange(len(values))
    if len(values) < 2 or np.all(values == values.iloc[0]):
        return 0.0
    return np.polyfit(x, values, 1)[0]

def classify(score):
    if score >= 70: return "مستقر (Healthy)"
    if score >= 40: return "متوسط (Moderate)"
    return "في خطر (At Risk)"


# ======================
# الخطوة 1: تحميل البيانات الشهرية وحساب النسب لكل صف

def load_and_score_monthly(path):
    df = pd.read_csv(path)
    df["Month_Num"] = df["Month"].map({m: i+1 for i, m in enumerate(MONTH_ORDER)})
    df = df.sort_values(["User_ID", "Month_Num"]).reset_index(drop=True)

    income = df["Monthly_Income"]
    df["Savings_Ratio"] = df["Savings"] / income
    df["Debt_Ratio"]    = df["Loans"] / income
    df["Housing_Ratio"] = df["Housing"] / income
    df["Balance_Ratio"] = df["Remaining_Balance"] / income

    df["Score_Savings"] = df["Savings_Ratio"].apply(score_savings)
    df["Score_Debt"]    = df["Debt_Ratio"].apply(score_debt)
    df["Score_Housing"] = df["Housing_Ratio"].apply(score_housing)
    df["Score_Balance"] = df["Balance_Ratio"].apply(score_balance)
    return df


# ========================================================================
# الخطوة 2: تجميع كل مستخدم (12 شهر -> صف واحد) + حساب الاتجاه والاستقرار
# ========================================================================

def build_user_features(monthly_df):
    rows = []
    for uid, g in monthly_df.groupby("User_ID"):
        g = g.sort_values("Month_Num")
        rows.append({
            "User_ID": uid,
            "Avg_Income": g["Monthly_Income"].mean(),
            "Avg_Score_Savings": g["Score_Savings"].mean(),
            "Avg_Score_Debt":    g["Score_Debt"].mean(),
            "Avg_Score_Housing": g["Score_Housing"].mean(),
            "Avg_Score_Balance": g["Score_Balance"].mean(),
            "Avg_Balance_Ratio": g["Balance_Ratio"].mean(),
            "Debt_Ratio_Avg":    g["Debt_Ratio"].mean(),
            "Balance_Trend":     trend_slope(g["Balance_Ratio"]),
            "Balance_Volatility": g["Balance_Ratio"].std(),
        })
    return pd.DataFrame(rows)


# ========================================================================
# الخطوة 3: حساب Nabdh_Score النهائي (أوزان + سقفين الحماية)
# ========================================================================

def compute_nabdh_score(user_df):
    user_df["Score_Trend"]      = user_df["Balance_Trend"].apply(score_trend)
    user_df["Score_Volatility"] = user_df["Balance_Volatility"].apply(score_volatility)

    score_cols = {
        "Score_Savings":    "Avg_Score_Savings",
        "Score_Debt":       "Avg_Score_Debt",
        "Score_Housing":    "Avg_Score_Housing",
        "Score_Balance":    "Avg_Score_Balance",
        "Score_Trend":      "Score_Trend",
        "Score_Volatility": "Score_Volatility",
    }
    raw_score = sum(user_df[col] * WEIGHTS[key] for key, col in score_cols.items())

    user_df["Deficit_Cap"] = user_df["Avg_Balance_Ratio"].apply(deficit_cap)
    user_df["Debt_Cap"]    = user_df["Debt_Ratio_Avg"].apply(debt_cap)

    cap = user_df[["Deficit_Cap", "Debt_Cap"]].min(axis=1)
    user_df["Nabdh_Score"] = np.minimum(raw_score, cap).round(1)
    user_df["Nabdh_Category"] = user_df["Nabdh_Score"].apply(classify)
    return user_df


# ========================================================================
# الخطوة 4: اختبار حالات يدوية (Validation) - تشغّل تلقائيًا كل مرة
# ========================================================================

def run_validation():
    def run_case(name, savings_r, debt_r, housing_r, balance_r, trend, vol):
        scores = {
            "Score_Savings": score_savings(savings_r),
            "Score_Debt": score_debt(debt_r),
            "Score_Housing": score_housing(housing_r),
            "Score_Balance": score_balance(balance_r),
            "Score_Trend": score_trend(trend),
            "Score_Volatility": score_volatility(vol),
        }
        raw = sum(scores[k] * WEIGHTS[k] for k in WEIGHTS)
        cap = min(deficit_cap(balance_r), debt_cap(debt_r))
        final = round(min(raw, cap), 1)
        return {"الحالة": name, "Nabdh_Score": final, "التصنيف": classify(final)}

    cases = [
        run_case("مثالي: دخل ممتاز + بدون دين + ادخار 25% + ثابت",
                  0.25, 0.02, 0.20, 0.20, 0.001, 0.002),
        run_case("كارثي: دين 45% + عجز شديد + يتدهور + متقلب جدًا",
                  0.0, 0.45, 0.40, -0.20, -0.008, 0.025),
        run_case("متوسط: منضبط بالمصاريف بس ما يدخر شي",
                  0.0, 0.15, 0.28, 0.05, 0.0, 0.008),
        run_case("فخ: وضع عام جيد لكن يتدهور بسرعة",
                  0.10, 0.08, 0.25, 0.10, -0.007, 0.015),
        run_case("عجز بسيط فقط: -2% من الدخل، باقي وضعه منضبط",
                  0.10, 0.12, 0.28, -0.02, 0.0, 0.006),
        run_case("دين خطر (40%) فقط، باقي الأمور ممتازة",
                  0.20, 0.40, 0.20, 0.12, 0.001, 0.004),
    ]
    return pd.DataFrame(cases)


# ========================================================================
# التشغيل الرئيسي
# ========================================================================

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("[1/4] تحميل البيانات الشهرية وحساب النسب...")
    monthly_df = load_and_score_monthly(INPUT_PATH)

    print("[2/4] تجميع الميزات الزمنية لكل مستخدم...")
    user_df = build_user_features(monthly_df)

    print("[3/4] حساب Nabdh Score النهائي...")
    user_df = compute_nabdh_score(user_df)

    print("[4/4] تشغيل اختبارات التحقق اليدوية...")
    validation_df = run_validation()

    user_df.to_csv(f"{OUTPUT_DIR}/Nabdh_Final_Scored.csv", index=False)
    validation_df.to_csv(f"{OUTPUT_DIR}/Validation_Report.csv", index=False)

    print("\n=== توزيع الفئات النهائي ===")
    print(user_df["Nabdh_Category"].value_counts())
    print("\n=== نتائج اختبار التحقق ===")
    print(validation_df.to_string(index=False))
    print(f"\nتم الحفظ في مجلد: {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
