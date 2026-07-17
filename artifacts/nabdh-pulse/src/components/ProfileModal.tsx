import React, { useState, useEffect } from "react";
import {
  X, User, Lock, Phone, MapPin, Users, Home, Calendar,
  Save, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  age?: number | null;
  maritalStatus?: string | null;
  housingType?: string | null;
  dependentsCount?: number | null;
  createdAt?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

type Tab = "info" | "security";

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5" style={{ fontFamily: "Tajawal, sans-serif" }}>
        <Icon className="w-3.5 h-3.5" /> {label}
      </label>
      {children}
    </div>
  );
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold ${ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}
      style={{ fontFamily: "Tajawal, sans-serif" }}>
      {ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      {msg}
    </div>
  );
}

export function ProfileModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("info");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Personal info form
  const [form, setForm] = useState({ name: "", phone: "", city: "", age: "", maritalStatus: "", housingType: "", dependentsCount: "" });

  // Security form
  const [secTab, setSecTab] = useState<"password" | "email">("password");
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [emForm, setEmForm] = useState({ newEmail: "", password: "" });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false, emPw: false });

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/users/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then((d: ProfileData | null) => {
        if (!d) return;
        setProfile(d);
        setForm({
          name: d.name ?? "",
          phone: d.phone ?? "",
          city: d.city ?? "",
          age: d.age != null ? String(d.age) : "",
          maritalStatus: d.maritalStatus ?? "",
          housingType: d.housingType ?? "",
          dependentsCount: d.dependentsCount != null ? String(d.dependentsCount) : "",
        });
        setEmForm(f => ({ ...f, newEmail: d.email }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  const saveInfo = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { name: form.name, phone: form.phone || null, city: form.city || null };
      if (form.age !== "") body.age = Number(form.age);
      if (form.maritalStatus) body.maritalStatus = form.maritalStatus;
      if (form.housingType) body.housingType = form.housingType;
      if (form.dependentsCount !== "") body.dependentsCount = Number(form.dependentsCount);

      const res = await fetch("/api/users/me", { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل الحفظ");
      setProfile(p => p ? { ...p, ...data } : data);
      showToast("تم حفظ المعلومات بنجاح ✓", true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "حدث خطأ", false);
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (pwForm.next !== pwForm.confirm) { showToast("كلمة المرور الجديدة غير متطابقة", false); return; }
    if (pwForm.next.length < 6) { showToast("كلمة المرور يجب أن تكون 6 أحرف على الأقل", false); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل تغيير كلمة المرور");
      setPwForm({ current: "", next: "", confirm: "" });
      showToast("تم تغيير كلمة المرور بنجاح ✓", true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "حدث خطأ", false);
    } finally { setSaving(false); }
  };

  const changeEmail = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-email", { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ newEmail: emForm.newEmail, currentPassword: emForm.password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل تغيير البريد");
      setProfile(p => p ? { ...p, email: emForm.newEmail } : p);
      setEmForm(f => ({ ...f, password: "" }));
      showToast("تم تغيير البريد الإلكتروني بنجاح ✓", true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "حدث خطأ", false);
    } finally { setSaving(false); }
  };

  if (!open) return null;

  const inputCls = "w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-white";
  const selectCls = inputCls + " appearance-none";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />

      {/* Panel — slides in from the right (RTL: left) */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl"
        dir="rtl"
        style={{ fontFamily: "Tajawal, sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-black text-lg select-none"
              style={{ fontFamily: "Cairo, sans-serif" }}>
              {profile?.name?.[0] ?? "؟"}
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-tight" style={{ fontFamily: "Cairo, sans-serif" }}>{profile?.name ?? "..."}</p>
              <p className="text-xs text-slate-400">{profile?.email ?? ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6">
          {([["info", "المعلومات الشخصية"], ["security", "أمان الحساب"]] as [Tab, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${tab === key ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : tab === "info" ? (
            <div className="space-y-4">
              <Field label="الاسم الكامل" icon={User}>
                <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="اسمك الكامل" />
              </Field>

              <Field label="رقم الجوال" icon={Phone}>
                <input className={inputCls} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="05xxxxxxxx" dir="ltr" />
              </Field>

              <Field label="المدينة" icon={MapPin}>
                <select className={selectCls} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}>
                  <option value="">اختر مدينتك</option>
                  {["الرياض","جدة","مكة المكرمة","المدينة المنورة","الدمام","الخبر","الأحساء","الطائف","بريدة","تبوك","أبها","نجران","الجبيل","ينبع","خميس مشيط"].map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="العمر" icon={Calendar}>
                  <input className={inputCls} type="number" min={18} max={80} value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="مثال: 28" />
                </Field>
                <Field label="عدد المعالين" icon={Users}>
                  <input className={inputCls} type="number" min={0} max={20} value={form.dependentsCount} onChange={e => setForm(f => ({ ...f, dependentsCount: e.target.value }))} placeholder="0" />
                </Field>
              </div>

              <Field label="الحالة الاجتماعية" icon={Users}>
                <select className={selectCls} value={form.maritalStatus} onChange={e => setForm(f => ({ ...f, maritalStatus: e.target.value }))}>
                  <option value="">اختر</option>
                  <option value="single">أعزب/عزباء</option>
                  <option value="married">متزوج/ة</option>
                  <option value="divorced">مطلق/ة</option>
                  <option value="widowed">أرمل/ة</option>
                </select>
              </Field>

              <Field label="نوع السكن" icon={Home}>
                <select className={selectCls} value={form.housingType} onChange={e => setForm(f => ({ ...f, housingType: e.target.value }))}>
                  <option value="">اختر</option>
                  <option value="owned">ملك</option>
                  <option value="rented">إيجار</option>
                  <option value="family">مع العائلة</option>
                  <option value="company">سكن شركة</option>
                </select>
              </Field>
            </div>
          ) : (
            /* Security tab */
            <div className="space-y-4">
              {/* Sub-tabs */}
              <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                {([["password","تغيير كلمة المرور"],["email","تغيير البريد"]] as ["password"|"email",string][]).map(([k,l]) => (
                  <button key={k} onClick={() => setSecTab(k)}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${secTab === k ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                    {l}
                  </button>
                ))}
              </div>

              {secTab === "password" ? (
                <div className="space-y-3 pt-1">
                  <Field label="كلمة المرور الحالية" icon={Lock}>
                    <div className="relative">
                      <input type={showPw.current ? "text" : "password"} className={inputCls + " pl-10"} value={pwForm.current}
                        onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} placeholder="••••••••" dir="ltr" />
                      <button type="button" onClick={() => setShowPw(s => ({ ...s, current: !s.current }))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>
                  <Field label="كلمة المرور الجديدة" icon={Lock}>
                    <div className="relative">
                      <input type={showPw.next ? "text" : "password"} className={inputCls + " pl-10"} value={pwForm.next}
                        onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} placeholder="6 أحرف على الأقل" dir="ltr" />
                      <button type="button" onClick={() => setShowPw(s => ({ ...s, next: !s.next }))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPw.next ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Strength indicator */}
                    {pwForm.next.length > 0 && (
                      <div className="mt-1.5 flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                            pwForm.next.length >= i * 3
                              ? i <= 1 ? "bg-red-400" : i <= 2 ? "bg-amber-400" : i <= 3 ? "bg-blue-400" : "bg-green-500"
                              : "bg-slate-200"
                          }`} />
                        ))}
                      </div>
                    )}
                  </Field>
                  <Field label="تأكيد كلمة المرور" icon={Lock}>
                    <div className="relative">
                      <input type={showPw.confirm ? "text" : "password"} className={inputCls + " pl-10"} value={pwForm.confirm}
                        onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="أعد كتابة كلمة المرور" dir="ltr" />
                      <button type="button" onClick={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {pwForm.confirm.length > 0 && pwForm.next !== pwForm.confirm && (
                      <p className="text-xs text-red-500 mt-1">كلمتا المرور غير متطابقتين</p>
                    )}
                  </Field>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <Field label="البريد الإلكتروني الجديد" icon={User}>
                    <input type="email" className={inputCls} value={emForm.newEmail}
                      onChange={e => setEmForm(f => ({ ...f, newEmail: e.target.value }))} placeholder="example@email.com" dir="ltr" />
                  </Field>
                  <Field label="كلمة المرور (للتأكيد)" icon={Lock}>
                    <div className="relative">
                      <input type={showPw.emPw ? "text" : "password"} className={inputCls + " pl-10"} value={emForm.password}
                        onChange={e => setEmForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" dir="ltr" />
                      <button type="button" onClick={() => setShowPw(s => ({ ...s, emPw: !s.emPw }))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPw.emPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && <div className="px-6 pb-2">{<Toast msg={toast.msg} ok={toast.ok} />}</div>}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100">
          <button
            onClick={tab === "info" ? saveInfo : secTab === "password" ? changePassword : changeEmail}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-l from-primary to-secondary text-white font-bold rounded-2xl hover:shadow-lg transition-all disabled:opacity-50"
            style={{ fontFamily: "Cairo, sans-serif" }}
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </div>
    </>
  );
}
