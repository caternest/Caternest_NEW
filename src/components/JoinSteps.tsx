import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

export default function JoinSteps({ currentStep }: { currentStep: number }) {
  const steps = [
    { title: "Menu & Pricing", desc: "AI Extraction" },
    { title: "Basic Details", desc: "Contact Information" },
    { title: "Business Details", desc: "Operations & Location" },
    { title: "Documents", desc: "Verification Documents" },
    { title: "Review & Submit", desc: "Final Confirmation" }
  ];

  return (
    <div className="relative">
      <div className="absolute left-[17px] top-4 bottom-4 w-[1.5px] bg-slate-200" />
      <div className="space-y-6">
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isActive = currentStep === stepNum;
          const isPast = currentStep > stepNum;
          
          return (
            <div key={idx} className="relative flex gap-4 select-none items-center">
              <div 
                className={cn(
                  "w-9 h-9 rounded-full flex flex-shrink-0 items-center justify-center relative z-10 transition-all duration-300 border-2 font-poppins text-sm font-semibold",
                  isPast ? "bg-brand-green-900 border-brand-green-900 text-white" : 
                  isActive ? "bg-brand-gold-500 border-brand-gold-500 text-slate-900 ring-4 ring-brand-gold-500/10 font-bold" : 
                  "bg-white border-slate-200 text-slate-400"
                )}
              >
                {isPast ? <Check size={16} strokeWidth={3} className="text-white" /> : <span>{stepNum}</span>}
              </div>
              <div className="pt-0.5">
                <p className={cn(
                  "text-xs font-bold font-poppins uppercase tracking-wider transition-colors", 
                  isActive ? "text-brand-gold-600" : isPast ? "text-brand-green-800" : "text-slate-400"
                )}>
                  {step.title}
                </p>
                <p className="text-[11px] text-slate-400 font-poppins leading-none mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
