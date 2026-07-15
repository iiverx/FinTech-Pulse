import React, { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { useLocation } from "wouter";
import { Database, Brain, LineChart, Target, CheckCircle2, Loader2 } from "lucide-react";

export default function AnalyzingPage() {
  const [, setLocation] = useLocation();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { icon: Database, label: "جمع البيانات البنكية", duration: 1500 },
    { icon: Brain, label: "تحليل بالذكاء الاصطناعي", duration: 2000 },
    { icon: LineChart, label: "تقييم الأنماط المالية", duration: 1800 },
    { icon: Target, label: "حساب مؤشر النبض", duration: 1500 },
    { icon: CheckCircle2, label: "إعداد لوحة نبض", duration: 1200 }
  ];

  useEffect(() => {
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setLocation("/result"), 500);
          return 100;
        }
        return prev + 1;
      });
    }, totalDuration / 100);

    return () => clearInterval(interval);
  }, [setLocation]);

  useEffect(() => {
    let elapsed = 0;
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    
    steps.forEach((step, idx) => {
      elapsed += step.duration;
      const percentage = (elapsed / totalDuration) * 100;
      
      setTimeout(() => {
        setCurrentStep(idx);
      }, (percentage / 100) * totalDuration);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Logo imageClassName="h-14" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4">جارٍ تحليل بياناتك...</h1>
          <p className="text-lg text-slate-600">
            نقوم الآن ببناء مؤشر نبضك المالي
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-12">
          <div className="mb-12">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-slate-600">التقدم</span>
              <span className="text-2xl font-bold text-primary">{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-l from-primary to-secondary h-4 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-6">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === currentStep;
              const isComplete = idx < currentStep;
              
              return (
                <div 
                  key={idx}
                  className={`flex items-center gap-4 p-5 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-gradient-to-l from-blue-50 to-green-50 border-2 border-primary shadow-lg' 
                      : isComplete
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-slate-50 border border-slate-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isActive 
                      ? 'bg-gradient-to-br from-primary to-secondary animate-pulse' 
                      : isComplete
                      ? 'bg-green-500'
                      : 'bg-slate-300'
                  }`}>
                    {isActive ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : isComplete ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : (
                      <StepIcon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg ${
                      isActive ? 'text-primary' : isComplete ? 'text-green-700' : 'text-slate-500'
                    }`}>
                      {step.label}
                    </h3>
                  </div>
                  {isActive && (
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-blue-900">
              هذه العملية تستغرق بضع ثوانٍ فقط. نستخدم أحدث تقنيات الذكاء الاصطناعي لتحليل وضعك المالي.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
