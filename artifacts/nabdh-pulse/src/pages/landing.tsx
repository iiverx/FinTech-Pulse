import React from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CircularIndicator } from "@/components/CircularIndicator";
import { HeroScene } from "@/components/HeroScene";
import { Link } from "wouter";
import { 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  Brain, 
  Target, 
  Wallet,
  PiggyBank,
  Bell,
  MessageSquare,
  Users,
  Sparkles,
  ChevronLeft,
  BarChart3,
  Calendar,
  CreditCard,
  LineChart,
  Zap
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
                وعيك المالي ينبض <span className="bg-gradient-to-l from-primary to-secondary bg-clip-text text-transparent">برقم</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                أول مؤشر ذكي يحوّل بياناتك البنكية إلى درجة يومية من 0 إلى 100، يتنبأ بمستقبلك المالي، ويساعدك على اتخاذ قرارات أفضل.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/auth"
                  className="px-8 py-4 bg-gradient-to-l from-primary to-secondary text-white rounded-lg font-bold text-lg hover:shadow-xl transition-all"
                >
                  ابدأ الآن
                </Link>
                <button className="px-8 py-4 bg-white border-2 border-primary text-primary rounded-lg font-bold text-lg hover:bg-blue-50 transition-all">
                  شاهد كيف يعمل
                </button>
              </div>
            </div>
            
            <div className="rounded-2xl overflow-hidden" style={{ height: "580px" }}>
              <HeroScene />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">المشكلة التي نحلها</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              الأدوات المالية الحالية معقدة، متأخرة، وغير مصممة للمستخدم العادي
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BarChart3, title: "تحليل متأخر", desc: "التطبيقات الحالية تعرض ما حدث بالأمس، لا ما سيحدث غدًا" },
              { icon: Brain, title: "صعوبة الفهم", desc: "جداول ورسوم بيانية معقدة تحتاج خبيرًا لفهمها" },
              { icon: Target, title: "غياب مؤشر موحد", desc: "لا يوجد رقم واحد يخبرك: 'هل أنا بخير ماليًا؟'" },
              { icon: AlertTriangle, title: "قرارات بلا توجيه", desc: "لا أحد يخبرك ماذا تفعل قبل أن تنفق أو تشتري" }
            ].map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <item.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Flow */}
      <section id="solution" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">الحل: نبض</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              نحوّل بياناتك المعقدة إلى رقم واحد واضح ومؤشرات قابلة للتنفيذ
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-8">
            {[
              { icon: CreditCard, text: "بياناتك البنكية" },
              { icon: Brain, text: "ذكاء اصطناعي" },
              { icon: LineChart, text: "تحليل عميق" },
              { icon: Target, text: "مؤشر النبض" },
              { icon: Zap, text: "توصيات ذكية" }
            ].map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <p className="font-semibold text-slate-700">{step.text}</p>
                </div>
                {idx < 4 && <ChevronLeft className="w-6 h-6 text-slate-400 hidden md:block" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* How Score Calculated */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">كيف يُحسب مؤشر النبض؟</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              خمسة عوامل رئيسية تحدد صحتك المالية
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Wallet, title: "نسبة الإنفاق/الدخل", desc: "كم تنفق مقارنة بدخلك", weight: "30%" },
              { icon: Target, title: "الالتزام بالميزانية", desc: "مدى التزامك بخطتك المالية", weight: "25%" },
              { icon: PiggyBank, title: "نمو المدخرات", desc: "تطور مدخراتك شهريًا", weight: "20%" },
              { icon: TrendingUp, title: "السلوك الشرائي", desc: "أنماط إنفاقك وعاداتك", weight: "15%" },
              { icon: Calendar, title: "انتظام السداد", desc: "التزامك بالدفعات المستحقة", weight: "10%" }
            ].map((factor, idx) => (
              <div key={idx} className="bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-200 rounded-xl p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <factor.icon className="w-10 h-10 text-primary" />
                  <span className="text-2xl font-bold text-secondary">{factor.weight}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{factor.title}</h3>
                <p className="text-slate-600 text-sm">{factor.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">مميزات نبض</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              أدوات ذكية شاملة لإدارة صحتك المالية
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Target, title: "مؤشر النبض المالي", desc: "درجة من 0-100 تعكس صحتك المالية في الوقت الفعلي" },
              { icon: Sparkles, title: "التنبؤ الاستباقي", desc: "نتنبأ بمؤشرك للأيام القادمة وننبهك للمخاطر" },
              { icon: Bell, title: "التنبيهات الذكية", desc: "إشعارات مخصصة لسلوكك المالي وفرص التوفير" },
              { icon: MessageSquare, title: "المساعد المالي الذكي", desc: "اسأل أي سؤال مالي واحصل على إجابة فورية" },
              { icon: Brain, title: "الحاسبة الذكية", desc: "احسب المبلغ الآمن للإنفاق يوميًا" },
              { icon: Zap, title: "محاكاة القرارات", desc: "اعرف تأثير أي قرار شرائي قبل تنفيذه" },
              { icon: Users, title: "مجتمع نبض", desc: "قارن مؤشرك مع الآخرين بشكل مجهول وآمن" }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-xl hover:border-primary transition-all">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Simulation */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-4">قبل أن تشتري، اسأل نبض</h2>
            <p className="text-xl text-slate-600">
              محاكاة تفاعلية: ماذا سيحدث لمؤشرك؟
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-8 border-2 border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">مؤشرك الحالي</p>
                <CircularIndicator value={78} size={140} label="مستقر ماليًا" />
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-2">بعد الشراء</p>
                <CircularIndicator value={72} size={140} label="يحتاج انتباه" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6 mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                أدخل قيمة الشراء
              </label>
              <input 
                type="number" 
                placeholder="350" 
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-lg text-center font-bold"
              />
              <p className="text-center mt-4 text-slate-600">ريال سعودي</p>
            </div>
            
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900 mb-2">توصية نبض</p>
                  <p className="text-amber-800">
                    يُفضّل تأجيل هذا الشراء. سيؤثر سلبًا على مؤشرك وقد يضعك في منطقة الخطر المالي.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Alerts */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-4">تنبيهات ذكية تستبق المشاكل</h2>
            <p className="text-xl text-slate-600">
              لا تنتظر حتى يحدث الخطأ — نبض ينبهك مسبقًا
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { 
                type: "warning", 
                title: "تحذير: إنفاق غير معتاد", 
                desc: "أنفقت 850 ريال على التسوق هذا الأسبوع، أكثر من المعتاد بـ 40%",
                color: "amber"
              },
              { 
                type: "success", 
                title: "فرصة توفير", 
                desc: "لاحظنا انخفاضًا في فواتيرك. يمكنك تحويل 200 ريال للادخار هذا الشهر",
                color: "green"
              },
              { 
                type: "info", 
                title: "اقتراب موعد سداد", 
                desc: "لديك دفعة بطاقة ائتمانية بقيمة 1,200 ريال بعد 3 أيام",
                color: "blue"
              },
              { 
                type: "danger", 
                title: "خطر انخفاض المؤشر", 
                desc: "مؤشرك قد ينخفض إلى 65 خلال أسبوع إذا استمر نمط الإنفاق الحالي",
                color: "red"
              }
            ].map((alert, idx) => (
              <div key={idx} className={`bg-${alert.color}-50 border-2 border-${alert.color}-200 rounded-xl p-6`}>
                <div className="flex items-start gap-4">
                  <Bell className={`w-6 h-6 text-${alert.color}-600 flex-shrink-0 mt-0.5`} />
                  <div>
                    <h3 className={`font-bold text-${alert.color}-900 mb-2`}>{alert.title}</h3>
                    <p className={`text-${alert.color}-700`}>{alert.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Assistant Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-4">المساعد المالي الذكي</h2>
            <p className="text-xl text-slate-600">
              اسأل أي سؤال مالي واحصل على إجابة فورية
            </p>
          </div>
          
          <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="bg-gradient-to-l from-primary to-secondary text-white rounded-2xl rounded-bl-sm px-6 py-3 max-w-md">
                  <p>هل أستطيع شراء جهاز بـ 3000 ريال هذا الشهر؟</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-white border border-slate-300 rounded-2xl rounded-br-sm px-6 py-3 max-w-md">
                  <p className="text-slate-800">
                    بناءً على وضعك الحالي، يُفضّل تأجيل هذا الشراء. لديك التزامات قادمة بقيمة 1,800 ريال، وهذا الشراء سيخفض مؤشرك من 78 إلى 58. أنصحك بالانتظار حتى الشهر القادم أو تقسيط المبلغ.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex gap-2">
              <input 
                type="text" 
                placeholder="اكتب سؤالك هنا..."
                className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg"
              />
              <button className="px-6 py-3 bg-gradient-to-l from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                إرسال
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-4">مجتمع نبض</h2>
            <p className="text-xl text-slate-600">
              قارن مؤشرك مع الآخرين بشكل مجهول وآمن بالكامل
            </p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-sm text-slate-600 mb-3">مؤشرك</p>
                <div className="text-5xl font-black text-primary mb-2">78</div>
                <p className="text-slate-700 font-semibold">مستقر ماليًا</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-3">متوسط المستخدمين</p>
                <div className="text-5xl font-black text-slate-500 mb-2">71</div>
                <p className="text-slate-700 font-semibold">أنت أفضل من المتوسط</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-3">أعلى 10%</p>
                <div className="text-5xl font-black text-secondary mb-2">88</div>
                <p className="text-slate-700 font-semibold">ممتاز ماليًا</p>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <p className="text-sm text-blue-800">
                جميع المقارنات مجهولة بالكامل. لا نشارك بياناتك الشخصية أبدًا.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Innovation Section */}
      <section id="innovation" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">ما يميز نبض</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              خمس نقاط ابتكارية تجعل نبض فريدًا في السوق السعودي
            </p>
          </div>
          
          <div className="space-y-6">
            {[
              { 
                title: "أول مؤشر مالي موحد في السعودية", 
                desc: "لا يوجد منافس محلي يقدم درجة واحدة شاملة لصحتك المالية"
              },
              { 
                title: "تنبؤ استباقي بالذكاء الاصطناعي", 
                desc: "نتنبأ بوضعك المالي للأيام القادمة، لا نكتفي بعرض الماضي"
              },
              { 
                title: "محاكاة القرارات قبل تنفيذها", 
                desc: "ميزة فريدة تسمح لك برؤية تأثير أي قرار مالي قبل اتخاذه"
              },
              { 
                title: "تكامل كامل مع بنك الإنماء", 
                desc: "مصمم خصيصًا للسوق السعودي والبنية التحتية المحلية"
              },
              { 
                title: "واجهة عربية بالكامل بتجربة محلية", 
                desc: "كل جانب من التطبيق مصمم بعناية للمستخدم السعودي"
              }
            ].map((point, idx) => (
              <div key={idx} className="bg-gradient-to-l from-blue-50 to-green-50 border-2 border-primary/20 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 text-white font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{point.title}</h3>
                    <p className="text-slate-600">{point.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value for Bank */}
      <section id="value" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">القيمة لبنك الإنماء</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              نبض ليس فقط للعملاء — إنه أداة استراتيجية للبنك
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                icon: Users, 
                title: "زيادة ولاء العملاء", 
                desc: "عملاء أكثر رضا يعني احتفاظ أعلى وإيرادات مستدامة"
              },
              { 
                icon: Brain, 
                title: "بيانات ثرية للتحليل", 
                desc: "فهم أعمق لسلوك العملاء وفرص تقديم منتجات مخصصة"
              },
              { 
                icon: TrendingUp, 
                title: "تقليل المخاطر الائتمانية", 
                desc: "مؤشرات مبكرة لعملاء قد يواجهون صعوبات مالية"
              },
              { 
                icon: Shield, 
                title: "تعزيز الثقة والشفافية", 
                desc: "البنك يساعد العملاء بشكل استباقي، لا يكتفي بالخدمات التقليدية"
              },
              { 
                icon: Sparkles, 
                title: "تميز تنافسي", 
                desc: "لا بنك آخر في السعودية يقدم مؤشرًا ذكيًا مماثلاً"
              }
            ].map((value, idx) => (
              <div key={idx} className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:border-primary hover:shadow-xl transition-all">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                  <value.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{value.title}</h3>
                <p className="text-slate-600 text-sm">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section id="vision" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary to-secondary text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">رؤيتنا المستقبلية</h2>
          <p className="text-xl md:text-2xl leading-relaxed opacity-95 mb-8">
            نطمح لأن نصبح المعيار الوطني للصحة المالية في السعودية، ونساعد ملايين المستخدمين على اتخاذ قرارات مالية أفضل، وبناء مستقبل مالي أكثر استقرارًا وازدهارًا.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-lg font-semibold">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6" />
              <span>مليون مستخدم بحلول 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              <span>توسع إقليمي</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              <span>تكامل مع جميع البنوك</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">
            ابدأ رحلتك نحو صحة مالية أفضل
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            انضم إلى آلاف المستخدمين الذين حسّنوا وضعهم المالي مع نبض
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/auth"
              className="px-10 py-4 bg-gradient-to-l from-primary to-secondary text-white rounded-lg font-bold text-lg hover:shadow-xl transition-all"
            >
              ابدأ الآن مجانًا
            </Link>
            <button className="px-10 py-4 bg-white border-2 border-slate-300 text-slate-700 rounded-lg font-bold text-lg hover:border-primary hover:text-primary transition-all">
              احجز عرضًا توضيحيًا
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
